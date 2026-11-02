import { supabase } from './supabase.js';
import './style.css';

const app = document.querySelector('#app');

const state = {
  screen: 'start',
  questions: [],
  current: 0,
  gender: '',
  ageGroup: '',
  answers: [],
  stats: null,
  filterGender: '',
  filterAge: ''
};

const AGE_GROUPS = ['10대 이하', '20대', '30대', '40대', '50대', '60대 이상'];
const GENDERS = ['여성', '남성', '기타', '응답하지 않음'];

function escapeHtml(value = '') {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
  })[char]);
}

function showError(message) {
  const el = document.querySelector('#notice');
  if (el) {
    el.textContent = message;
    el.classList.add('visible');
  } else {
    alert(message);
  }
}

function shell(content) {
  app.innerHTML = `
    <main class="page">
      <header class="topbar">
        <a class="brand" href="#" aria-label="처음으로" id="home-link">
          <span class="brand-mark">AI</span>
          <span>AI 윤리 딜레마</span>
        </a>
        <span class="top-note">익명 참여 · 로그인 없음</span>
      </header>
      ${content}
      <footer>AI 윤리 딜레마 참여 웹사이트</footer>
    </main>`;
  document.querySelector('#home-link')?.addEventListener('click', (e) => {
    e.preventDefault();
    if (state.screen === 'start') return;
    if (confirm('처음 화면으로 이동할까요? 작성 중인 응답은 저장되지 않습니다.')) {
      resetToStart();
    }
  });
}

function resetToStart() {
  state.screen = 'start';
  state.current = 0;
  state.gender = '';
  state.ageGroup = '';
  state.answers = [];
  render();
}

async function loadQuestions() {
  if (!supabase) throw new Error('Supabase 환경변수가 설정되지 않았습니다.');
  const { data, error } = await supabase
    .from('questions')
    .select('id, order_num, title, option_a, option_b')
    .eq('is_active', true)
    .order('order_num', { ascending: true })
    .limit(3);

  if (error) throw error;
  if (!data || data.length !== 3) {
    throw new Error('현재 참여 가능한 문항이 3개가 아닙니다. Supabase questions 테이블을 확인해 주세요.');
  }
  return data;
}

function renderStart() {
  shell(`
    <section class="hero">
      <div class="eyebrow">THINK · CHOOSE · SHARE</div>
      <h1>인공지능의 선택,<br><span>당신의 생각은?</span></h1>
      <p class="lead">일상에서 만날 수 있는 인공지능 윤리 딜레마를 읽고<br>가장 적절하다고 생각하는 선택과 그 이유를 알려주세요.</p>
      <div class="info-row">
        <div><strong>3문항</strong><small>총 참여 문항</small></div>
        <div><strong>익명</strong><small>이름 수집 없음</small></div>
        <div><strong>약 3분</strong><small>예상 소요 시간</small></div>
      </div>
      <button class="button primary wide" id="start-btn">참여 시작하기 <span>→</span></button>
      <p class="privacy-note">응답은 익명으로 저장되며 통계 및 의견 공유에 활용됩니다.</p>
      <button class="text-button" id="stats-btn">다른 참여자 응답 통계 보기</button>
      <div id="notice" class="notice"></div>
    </section>
  `);
  document.querySelector('#start-btn').addEventListener('click', async () => {
    const button = document.querySelector('#start-btn');
    button.disabled = true;
    button.textContent = '문항을 불러오는 중...';
    try {
      state.questions = await loadQuestions();
      state.screen = 'profile';
      render();
    } catch (error) {
      button.disabled = false;
      button.textContent = '참여 시작하기 →';
      showError(error.message || '문항을 불러오지 못했습니다.');
    }
  });
  document.querySelector('#stats-btn').addEventListener('click', () => {
    state.screen = 'stats';
    render();
    loadStats();
  });
}

function renderProfile() {
  shell(`
    <section class="panel narrow">
      <div class="step-label">참여자 정보 <span>01 / 04</span></div>
      <div class="progress"><i style="width:25%"></i></div>
      <h2>간단한 정보를<br>입력해 주세요.</h2>
      <p class="muted">통계 분석을 위한 정보입니다. 이름이나 연락처는 수집하지 않습니다.</p>
      <form id="profile-form" class="form">
        <label for="age">연령대</label>
        <select id="age" required>
          <option value="">연령대를 선택해 주세요</option>
          ${AGE_GROUPS.map(v => `<option value="${escapeHtml(v)}" ${state.ageGroup === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
        </select>
        <label>성별</label>
        <div class="choice-grid">
          ${GENDERS.map(v => `<label class="choice-chip"><input type="radio" name="gender" value="${escapeHtml(v)}" ${state.gender === v ? 'checked' : ''} required><span>${escapeHtml(v)}</span></label>`).join('')}
        </div>
        <div id="notice" class="notice"></div>
        <button class="button primary wide" type="submit">다음으로 <span>→</span></button>
      </form>
    </section>
  `);
  document.querySelector('#profile-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const gender = document.querySelector('input[name="gender"]:checked')?.value;
    const ageGroup = document.querySelector('#age').value;
    if (!gender || !ageGroup) return showError('연령대와 성별을 선택해 주세요.');
    state.gender = gender;
    state.ageGroup = ageGroup;
    state.screen = 'question';
    state.current = 0;
    render();
  });
}

function renderQuestion() {
  const q = state.questions[state.current];
  const step = state.current + 1;
  const saved = state.answers[state.current] || { choice: '', reason: '' };
  shell(`
    <section class="panel">
      <div class="step-label">AI 윤리 딜레마 <span>0${step} / 03</span></div>
      <div class="progress"><i style="width:${25 + step * 25}%"></i></div>
      <div class="question-number">DILEMMA 0${step}</div>
      <h2 class="question-title">${escapeHtml(q.title)}</h2>
      <p class="muted">상황을 읽고 더 적절하다고 생각하는 선택을 해주세요.</p>
      <form id="answer-form" class="form">
        <div class="option-list">
          <label class="option-card ${saved.choice === 'A' ? 'selected' : ''}">
            <input type="radio" name="choice" value="A" ${saved.choice === 'A' ? 'checked' : ''} required>
            <span class="option-letter">A</span><span>${escapeHtml(q.option_a)}</span>
          </label>
          <label class="option-card ${saved.choice === 'B' ? 'selected' : ''}">
            <input type="radio" name="choice" value="B" ${saved.choice === 'B' ? 'checked' : ''} required>
            <span class="option-letter">B</span><span>${escapeHtml(q.option_b)}</span>
          </label>
        </div>
        <label for="reason">이렇게 선택한 이유를 적어주세요.</label>
        <textarea id="reason" rows="4" maxlength="1000" placeholder="선택한 이유나 중요하게 생각한 점을 자유롭게 작성해 주세요. (선택 사항)">${escapeHtml(saved.reason)}</textarea>
        <div class="form-foot"><span>이유 작성은 선택 사항입니다.</span><span id="char-count">0 / 1000</span></div>
        <div id="notice" class="notice"></div>
        <div class="button-row">
          ${step > 1 ? '<button type="button" class="button secondary" id="back-btn">이전</button>' : ''}
          <button class="button primary" type="submit">${step === 3 ? '응답 제출하기' : '다음 문항'} <span>→</span></button>
        </div>
      </form>
    </section>
  `);
  const textarea = document.querySelector('#reason');
  const count = document.querySelector('#char-count');
  const updateCount = () => count.textContent = `${textarea.value.length} / 1000`;
  updateCount();
  textarea.addEventListener('input', updateCount);

  document.querySelectorAll('input[name="choice"]').forEach(input => {
    input.addEventListener('change', () => {
      document.querySelectorAll('.option-card').forEach(el => el.classList.remove('selected'));
      input.closest('.option-card').classList.add('selected');
    });
  });

  document.querySelector('#back-btn')?.addEventListener('click', () => {
    saveCurrentAnswer();
    state.current -= 1;
    renderQuestion();
  });

  document.querySelector('#answer-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const choice = document.querySelector('input[name="choice"]:checked')?.value;
    if (!choice) return showError('A 또는 B를 선택해 주세요.');
    saveCurrentAnswer();
    if (state.current < 2) {
      state.current += 1;
      renderQuestion();
    } else {
      await submitResponses();
    }
  });
}

function saveCurrentAnswer() {
  const choice = document.querySelector('input[name="choice"]:checked')?.value || '';
  const reason = document.querySelector('#reason')?.value || '';
  state.answers[state.current] = {
    question_id: state.questions[state.current].id,
    question_title: state.questions[state.current].title,
    choice,
    reason: reason.trim()
  };
}

async function submitResponses() {
  const button = document.querySelector('#answer-form button[type="submit"]');
  button.disabled = true;
  button.textContent = '응답을 저장하고 있습니다...';
  const payload = {
    gender: state.gender,
    age_group: state.ageGroup,
    answers: state.answers
  };
  const { error } = await supabase.from('responses').insert(payload);
  if (error) {
    button.disabled = false;
    button.textContent = '응답 제출하기 →';
    showError(`응답 저장에 실패했습니다: ${error.message}`);
    return;
  }
  state.screen = 'complete';
  render();
}

function renderComplete() {
  shell(`
    <section class="hero complete">
      <div class="success-icon">✓</div>
      <div class="eyebrow">THANK YOU</div>
      <h1>소중한 의견을<br><span>보내주셨습니다.</span></h1>
      <p class="lead">참여해 주셔서 감사합니다.<br>다른 참여자들의 생각과 통계도 살펴보세요.</p>
      <button class="button primary wide" id="see-stats">응답 통계 보기 →</button>
      <button class="text-button" id="again">처음으로 돌아가기</button>
    </section>
  `);
  document.querySelector('#see-stats').addEventListener('click', () => {
    state.screen = 'stats';
    render();
    loadStats();
  });
  document.querySelector('#again').addEventListener('click', resetToStart);
}

async function loadStats() {
  const container = document.querySelector('#stats-content');
  if (!container) return;
  if (!supabase) {
    container.innerHTML = '<p class="notice visible">Supabase 환경변수를 설정해 주세요.</p>';
    return;
  }
  container.innerHTML = '<p class="muted">통계를 불러오는 중입니다...</p>';
  const { data, error } = await supabase.rpc('get_public_stats', {
    p_gender: state.filterGender || null,
    p_age_group: state.filterAge || null
  });
  if (error) {
    container.innerHTML = `<p class="notice visible">통계를 불러오지 못했습니다: ${escapeHtml(error.message)}</p>`;
    return;
  }
  state.stats = data;
  renderStatsContent();
}

function renderStatsContent() {
  const container = document.querySelector('#stats-content');
  if (!container || !state.stats) return;
  const stats = state.stats;
  const questions = stats.questions || [];
  container.innerHTML = `
    <div class="total-card"><span>선택한 조건의 참여 응답</span><strong>${Number(stats.total_responses || 0).toLocaleString()}<small>명</small></strong></div>
    ${questions.map((q, index) => {
      const total = Number(q.total || 0);
      const a = Number(q.a_count || 0);
      const b = Number(q.b_count || 0);
      const aPct = total ? Math.round(a / total * 100) : 0;
      const bPct = total ? 100 - aPct : 0;
      return `
        <article class="stat-card">
          <div class="question-number">DILEMMA 0${index + 1}</div>
          <h3>${escapeHtml(q.title)}</h3>
          <div class="bar-label"><span>A 선택</span><strong>${a}명 · ${aPct}%</strong></div>
          <div class="bar"><i style="width:${aPct}%"></i></div>
          <div class="bar-label"><span>B 선택</span><strong>${b}명 · ${bPct}%</strong></div>
          <div class="bar"><i class="bar-b" style="width:${bPct}%"></i></div>
          <p class="muted small">응답 ${total}명</p>
          <details class="opinions">
            <summary>참여자 의견 보기 (${(q.opinions || []).length})</summary>
            ${(q.opinions || []).length ? q.opinions.map(op => `
              <div class="opinion">
                <span class="tag">선택 ${escapeHtml(op.choice)}</span>
                <p>${escapeHtml(op.reason)}</p>
              </div>`).join('') : '<p class="muted small">공개할 의견이 아직 없습니다.</p>'}
          </details>
        </article>`;
    }).join('')}
    ${questions.length === 0 ? '<p class="muted">표시할 통계가 없습니다.</p>' : ''}
  `;
}

function renderStats() {
  shell(`
    <section class="panel">
      <div class="step-label">RESULTS <span>응답 통계</span></div>
      <h2>다른 참여자들은<br>어떻게 생각했을까요?</h2>
      <p class="muted">연령대와 성별을 선택해 응답 결과를 살펴볼 수 있습니다.</p>
      <div class="filters">
        <label for="filter-age">연령대</label>
        <select id="filter-age">
          <option value="">전체 연령</option>
          ${AGE_GROUPS.map(v => `<option value="${escapeHtml(v)}" ${state.filterAge === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
        </select>
        <label for="filter-gender">성별</label>
        <select id="filter-gender">
          <option value="">전체 성별</option>
          ${GENDERS.map(v => `<option value="${escapeHtml(v)}" ${state.filterGender === v ? 'selected' : ''}>${escapeHtml(v)}</option>`).join('')}
        </select>
        <button class="button primary" id="apply-filter">통계 적용</button>
      </div>
      <div id="stats-content"><p class="muted">통계를 불러오는 중입니다...</p></div>
      <button class="button secondary wide" id="stats-home">처음으로</button>
    </section>
  `);
  document.querySelector('#apply-filter').addEventListener('click', () => {
    state.filterAge = document.querySelector('#filter-age').value;
    state.filterGender = document.querySelector('#filter-gender').value;
    loadStats();
  });
  document.querySelector('#stats-home').addEventListener('click', resetToStart);
}

function render() {
  switch (state.screen) {
    case 'start': renderStart(); break;
    case 'profile': renderProfile(); break;
    case 'question': renderQuestion(); break;
    case 'complete': renderComplete(); break;
    case 'stats': renderStats(); loadStats(); break;
    default: renderStart();
  }
}

render();
