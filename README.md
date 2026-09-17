# 나를 알려줘 (I wanna know me) — React / TypeScript / Tailwind / Supabase

Next.js(App Router) + TypeScript + Tailwind CSS + Supabase(카카오 로그인, DB) 버전입니다.

## 실행 방법

```bash
npm install
cp .env.example .env.local   # 값을 채운 뒤
npm run dev
```

- `http://localhost:3000` — 질문자/답변자 화면
- `http://localhost:3000/admin` — 관리자 페이지 (관리자 계정으로 로그인해야 접근 가능)

## 지금 상태

이 코드베이스는 실제 Supabase 백엔드로 연결되어 있습니다 (더 이상 localStorage
목업이 아닙니다). 아래 순서대로 설정하면 바로 동작합니다.

## 1. Supabase 프로젝트 설정

1. [supabase.com](https://supabase.com) 에서 새 프로젝트를 만듭니다.
2. 프로젝트 설정 > API 에서 `Project URL`, `anon public key`, `service_role key`를
   복사해 `.env.local`에 채웁니다.
3. SQL Editor에서 `supabase/schema.sql` 파일 전체 내용을 실행합니다. 테이블
   (profiles, admin_allowlist, categories, question_bank, questionnaires,
   responses, admin_audit_log), RLS 정책, RPC 함수, 트리거, 기본 카테고리
   (외모/패션/성격/관계/추억/가십)가 한 번에 만들어집니다.

## 2. 카카오 로그인 연동

1. [카카오 디벨로퍼스](https://developers.kakao.com)에서 애플리케이션을 만들고
   "카카오 로그인"을 활성화합니다.
2. Redirect URI에 `https://<Supabase 프로젝트 참조 ID>.supabase.co/auth/v1/callback`
   를 등록합니다. (Supabase가 카카오 OAuth 교환을 대신 처리하므로, 이 앱 코드에는
   카카오 REST API 키를 직접 넣지 않습니다.)
3. Supabase 대시보드 > Authentication > Providers > Kakao 에서 활성화하고,
   카카오 디벨로퍼스의 REST API 키 / Client Secret을 입력합니다.
4. 로그인 1회 후 `auth.users` 테이블의 `raw_user_meta_data`를 확인해서,
   `supabase/schema.sql`의 `handle_new_user()` 함수가 닉네임/프로필사진/카카오
   식별자를 올바른 필드에서 읽고 있는지 확인하세요. 카카오 응답 필드명이 다르면
   그 함수만 고치면 됩니다.

## 3. 최초 관리자 등록 (딱 한 번, 수동)

1. 본인 카카오 계정으로 사이트에 한 번 로그인합니다.
2. Supabase SQL Editor에서 `select kakao_id from public.profiles;`로 본인의
   `kakao_id`를 확인합니다.
3. `supabase/schema.sql` 맨 아래에 있는 부트스트랩 SQL 두 줄의 주석을 풀고
   본인 kakao_id로 바꿔서 실행합니다.
4. 이후부터는 `/admin/admins` 페이지에서 관리자를 자유롭게 추가/삭제할 수
   있습니다 (더 이상 SQL을 직접 만질 필요 없음).

## 4. Google AdSense 설정 (승인 잘 받기 위한 세팅)

- `.env.local`의 `NEXT_PUBLIC_ADSENSE_CLIENT_ID`에 애드센스 client id
  (`ca-pub-...`)를 넣으면 `<head>`에 자동으로 스크립트와
  `google-adsense-account` 메타 태그가 삽입됩니다. **승인 전에는 비워두세요.**
- `public/ads.txt`의 `pub-0000000000000000`을 애드센스에서 안내하는 실제
  퍼블리셔 ID로 교체하세요.
- `NEXT_PUBLIC_SITE_URL`에 실제 배포 도메인을 넣으면 `sitemap.xml`,
  `robots.txt`, canonical URL, Open Graph 태그가 그 도메인 기준으로 생성됩니다.
- `/about`, `/privacy`, `/terms` 페이지에 서비스 소개·개인정보처리방침(애드센스
  쿠키 고지 포함)·이용약관을 갖춰뒀습니다. `(운영자 이름을 입력하세요)` 등
  괄호로 표시된 부분을 실제 정보로 채우세요.
- `/admin` 경로는 `robots.ts`에서 색인 제외 처리했습니다.

## 폴더 구조

```
app/
  layout.tsx              전역 폰트/스타일 + AuthProvider + 애드센스 스크립트
  robots.ts, sitemap.ts   SEO/애드센스용 메타 라우트
  auth/callback/          카카오 로그인 콜백 (세션 교환 + 동의 기록)
  api/account/delete/     계정 완전 삭제 (service role 사용, 서버 전용)
  (site)/                 질문자·답변자 화면 (폰 폭 프레임, 로그인 시 햄버거 메뉴 노출)
    page.tsx              인트로
    about/                서비스 소개
    login/                카카오 로그인 + 개인정보 동의
    build/                질문 선택 → 필수 질문 설정 → 발행 (미리보기 기능은 제거됨)
    my/responses/         받은 답변 보기 (햄버거 메뉴)
    share/[id]/            공유 링크
    r/[id]/                답변자 진입 → 답변 → 필수 마무리 → 완료
    privacy/, terms/       법적 문서
  admin/                  관리자 화면 (middleware.ts + RLS로 이중 보호)
    page.tsx              유저 목록
    users/[userId]/        유저 상세
    questions/             카테고리·질문 은행 관리
    admins/                관리자 계정 관리
components/
  layout/                 SiteHeader(햄버거 버튼), NavDrawer(슬라이드 메뉴)
  ads/                    AdsenseScript
  ui/, builder/, admin/    공통 UI, 빌더 전용, 관리자 전용 컴포넌트
lib/
  supabase/               브라우저/서버 Supabase 클라이언트 + 미들웨어 세션 갱신
  auth/AuthProvider.tsx   로그인 상태(프로필/관리자 여부) 전역 제공
  types.ts                핵심 타입 (Supabase 스키마와 1:1 대응)
  questionPool.ts         기본 질문 데이터(외모/패션/성격/관계/추억/가십) + DB 연동 loadQuestionPool()
  mockDb.ts               관리자 페이지 데이터 계층 (Supabase 쿼리 + RPC)
  creatorFlow.ts          질문자/답변자 흐름 데이터 계층 (Supabase 쿼리)
  adminAuth.ts            서버에서 관리자 세션 확인
middleware.ts             /build, /my 로그인 필수 + /admin 관리자 권한 확인
supabase/schema.sql       테이블 + RLS + RPC + 트리거 + 시드 데이터 (SQL Editor에서 1회 실행)
```

## 최근 반영된 변경 사항

- 프로젝트 타이틀을 &lsquo;나를 알려줘&rsquo;로 변경
- 질문 미리보기 기능 제거 (build/final에서 바로 발행)
- 관계 선택지에 &lsquo;절친&rsquo; 추가 (타입/DB 제약조건/응답 화면 모두 반영)
- &lsquo;패션&rsquo; 카테고리 추가, &lsquo;외모&rsquo; 카테고리 질문 재작성
- Supabase 기반 실제 백엔드 (카카오 로그인, 유저/질문지/답변 DB 저장)
- 관리자 페이지에서 카테고리·질문 추가, 관리자 계정(카카오 아이디) 등록
- 로그인 시 우측 상단 햄버거 버튼 → 50% 폭 슬라이드 네비게이션(어두운 오버레이,
  프로필사진·닉네임, 새 질문 만들기, 받은 답변 보기, 관리자 페이지(관리자만),
  로그아웃, 계정 삭제)
- 구글 애드센스 승인을 위한 세팅 (ads.txt, sitemap/robots, 메타태그, About
  페이지, 개인정보처리방침 보강)

## 보안 설계 요약

- 관리자 권한 변경(정지/영구삭제/관리자 등록 등)은 전부 Postgres의
  `SECURITY DEFINER` RPC 함수를 통해서만 가능하고, 그 함수들이 `auth.uid()`
  기준으로 호출자가 실제 admin role인지 매번 다시 확인합니다.
- `/admin` 라우트는 `middleware.ts`(요청 단계)와 RLS(쿼리 단계)로 이중 보호됩니다.
- 질문지는 발행 후 수정할 수 없습니다 (의도적 설계 — 발행 후 질문을 바꾸면
  이미 받은 답변과 순서가 어긋나기 때문).
- 계정 완전 삭제는 service role 키가 필요한 Supabase Admin API를 서버
  라우트에서만 호출하며, 호출 전 반드시 본인 세션인지 확인합니다.

## 알려진 제약 / TODO

- 이 세션의 네트워크 정책상 `npm install`/`npm run build`를 여기서 직접
  실행/검증하지 못했습니다. 로컬에서 한 번 확인해주세요.
- 카카오 로그인 응답 필드명(`raw_user_meta_data`)은 실제 로그인 1회 후 확인이
  필요합니다 (위 2-4 참고).
- `/privacy`, `/terms`, `/about`의 괄호 표시 플레이스홀더(운영자 이름/연락처)를
  실제 정보로 채워야 합니다.
