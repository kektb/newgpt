# AI 윤리 딜레마 웹사이트

익명 참여자가 연령대·성별을 입력하고 3개의 AI 윤리 딜레마에 A/B로 응답하는 웹사이트입니다. 응답 결과는 Supabase에 저장되며, 통계 화면에서 연령대와 성별을 필터링할 수 있습니다.

## 1. 기술 구성

- Vite + JavaScript
- Supabase Database
- GitHub 저장소
- Vercel 배포

## 2. Supabase 설정

1. Supabase에서 새 프로젝트를 생성합니다.
2. 왼쪽 메뉴의 **SQL Editor**로 이동합니다.
3. `supabase/schema.sql` 파일의 전체 SQL을 붙여 넣고 실행합니다.
4. **Project Settings → API**에서 Project URL과 anon/public key를 확인합니다.
5. Supabase의 **Table Editor → questions**에서 문항 3개를 수정할 수 있습니다.

문항은 `order_num` 1, 2, 3 순서로 표시됩니다. 사용하지 않을 문항은 `is_active`를 false로 바꾸세요. 참여 화면은 활성 문항이 정확히 3개일 때 진행됩니다.

## 3. 로컬 실행

프로젝트 폴더에서 터미널을 열고 다음 명령어를 실행합니다.

```bash
npm install
```

`.env.example` 파일을 복사해 `.env` 파일을 만들고 Supabase 값을 입력합니다.

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

그다음 실행합니다.

```bash
npm run dev
```

터미널에 표시되는 로컬 주소(보통 http://localhost:5173)를 브라우저에서 엽니다.

배포용 빌드 확인:

```bash
npm run build
```

## 4. GitHub 업로드

GitHub에서 새 저장소를 만든 뒤 프로젝트 폴더에서 실행합니다.

```bash
git init
git add .
git commit -m "Initial AI ethics dilemma website"
git branch -M main
git remote add origin https://github.com/사용자이름/저장소이름.git
git push -u origin main
```

`.env` 파일은 `.gitignore`에 포함되어 GitHub에 올라가지 않습니다. `.env.example`만 업로드됩니다.

## 5. Vercel 배포

1. Vercel에서 **Add New → Project**를 선택합니다.
2. GitHub 저장소를 연결합니다.
3. Framework Preset은 Vite로 설정합니다.
4. Environment Variables에 아래 두 항목을 추가합니다.
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Deploy를 누릅니다.

환경변수를 나중에 수정했다면 다시 배포해야 합니다.

## 6. 문항 수정

Supabase → Table Editor → `questions`에서 다음 항목을 수정합니다.

- `title`: 딜레마 상황
- `option_a`: A 선택지
- `option_b`: B 선택지
- `order_num`: 표시 순서
- `is_active`: 사용 여부

문항을 수정한 뒤 웹사이트를 다시 배포할 필요는 없습니다.

## 7. 통계와 개인정보 보호

- 이름, 이메일, 전화번호, 로그인 정보는 받지 않습니다.
- 성별, 연령대, 문항별 선택·이유, 응답 시각을 저장합니다.
- 응답 원본 테이블은 공개 SELECT를 허용하지 않습니다.
- 통계는 `get_public_stats` RPC를 통해 집계 결과와 이유가 작성된 의견 일부(문항별 최근 50개)를 반환합니다.
- Supabase의 anon key는 브라우저에서 사용되는 공개 키입니다. 보안은 RLS 정책으로 보호합니다.
- `service_role` 키는 절대로 프런트엔드 코드나 Vercel의 `VITE_` 환경변수에 넣지 마세요.

## 8. 운영 전 확인할 사항

- 예시 문항을 실제 사용할 문항으로 교체합니다.
- 참여자 안내문과 개인정보 처리 안내를 실제 운영 목적에 맞게 보완합니다.
- 공개 의견에 개인정보나 민감한 내용이 입력되지 않도록 안내합니다.
- 이 프로젝트는 익명 참여를 목표로 하지만, 응답 내용에 스스로 개인정보를 적을 가능성까지 막지는 못합니다.
