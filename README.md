# 너에게 난? (I wanna know me) — React / TypeScript / Tailwind

Next.js(App Router) + TypeScript + Tailwind CSS로 이식한 버전입니다.

## 실행 방법

```bash
npm install
npm run dev
```

- `http://localhost:3000` — 질문자/답변자 화면 (기존 프로토타입 흐름 그대로)
- `http://localhost:3000/admin` — 관리자 페이지 (검색/페이지네이션/답변 숨김·복구·영구삭제)

관리자 페이지는 처음 열면 예시(seed) 유저 15명이 자동으로 채워집니다. `lib/mockDb.ts`의
`seedIfEmpty()`를 지우거나 브라우저 localStorage를 초기화하면 리셋됩니다.

## 지금 상태 (중요)

이 코드베이스는 **아직 실제 백엔드가 없습니다.**

- 질문자/답변자 화면(`app/(site)/...`)은 `lib/creatorFlow.ts`를 통해 브라우저
  localStorage에 데이터를 저장합니다 — 이전 HTML 프로토타입과 동일한 한계입니다
  (다른 사람 기기에서는 데이터가 공유되지 않음).
- 관리자 페이지(`app/admin/...`)는 `lib/mockDb.ts`의 예시 데이터를 보여줍니다 —
  실제 가입자 데이터가 아닙니다.
- 카카오 로그인은 실제로 연동되어 있지 않습니다.

두 계층 모두 **함수 시그니처를 실제 Supabase 쿼리와 최대한 비슷하게** 맞춰뒀기
때문에, 나중에 `lib/creatorFlow.ts`와 `lib/mockDb.ts` 내부 구현만 Supabase
클라이언트 호출로 교체하면 화면 컴포넌트 쪽은 거의 손댈 필요가 없습니다.

## 실제 서비스로 넘어가기 전 체크리스트

### 1. 인증 & 권한 (가장 중요)
- [ ] `middleware.example.ts` → `middleware.ts`로 이름 바꾸고, 실제 Supabase 세션
      검증 로직으로 채우기 (`lib/adminAuth.ts` 주석 참고)
- [ ] Supabase `profiles` 테이블에 `role` 컬럼 추가, RLS 정책으로 관리자만
      다른 유저 데이터를 조회/수정할 수 있도록 DB 레벨에서도 강제
- [ ] 영구 삭제(purge)처럼 되돌릴 수 없는 액션은 super_admin 등 더 높은 권한
      등급으로 분리 검토

### 2. 개인정보 보호
- [ ] `app/(site)/privacy/page.tsx`, `app/(site)/terms/page.tsx` 내용을 실제
      법률 검토를 거쳐 완성하기 (지금은 템플릿)
- [ ] 생년월일 등 민감한 선택 정보는 꼭 필요한 화면에서만 전체 값을 노출하고,
      목록처럼 노출 범위가 넓은 화면에서는 마스킹 유지 (`app/admin/page.tsx`의
      `maskBirthDate` 참고)
- [ ] 회원 탈퇴 시 개인정보 파기 로직 구현 (지금은 없음)

### 3. 데이터베이스 전환
- [ ] `lib/mockDb.ts`, `lib/creatorFlow.ts`를 Supabase 클라이언트 호출로 교체
- [ ] `visibility: "purged"` 상태로 남겨두는 대신, 실제로는 행(row) 자체를
      삭제하거나 별도의 "삭제 이력만 남기는 감사 테이블"로 옮기는 방식을 권장
      (지금 코드는 데모에서 감사 로그를 보여주기 위해 상태값으로만 남겨둠)

### 4. 남은 기능 아이디어 (관리자 페이지에 추가로 고려해볼 것)
- 신고된 답변만 모아보는 큐 (지금은 관리자가 전체 답변을 직접 훑어봐야 함)
- 대시보드 통계 (오늘 가입자 수, 총 질문지 수, 총 답변 수)
- 관리자 계정 자체의 권한 등급 구분 (일반 관리자 / 최고 관리자)
- CSV 내보내기는 개인정보가 포함되므로 신중하게 — 필요하다면 접근 로그를
  남기고 다운로드 자체도 감사 로그에 기록하는 걸 권장

## 폴더 구조

```
app/
  layout.tsx              전역 폰트/스타일
  (site)/                 질문자·답변자 화면 (폰 폭 프레임)
    page.tsx              인트로
    login/                로그인(mock) + 개인정보 동의
    build/                질문 선택 → 필수 질문 미리보기 → 미리보기
    share/[id]/           공유 링크
    r/[id]/                답변자 진입 → 답변 → 필수 마무리 → 완료
    privacy/, terms/       법적 문서 템플릿
  admin/                  관리자 화면 (넓은 화면)
    page.tsx              유저 목록 (검색 + 30명 페이지네이션)
    users/[userId]/        유저 상세 (질문/답변, 숨김·복구·영구삭제, 활동 로그)
components/
  ui/                     공통 UI (Button, Card, ConsentCheckboxes 등)
  builder/                질문 선택 화면 전용 (드래그 정렬 리스트)
  admin/                  관리자 화면 전용 (Pagination, ConfirmDialog, ResponseCard)
lib/
  types.ts                핵심 타입 (Supabase 스키마와 1:1 대응 목표)
  questionPool.ts         카테고리별 질문 데이터
  mockDb.ts               관리자용 목업 DB (추후 Supabase로 교체)
  creatorFlow.ts          질문자/답변자 흐름용 목업 저장소 (추후 Supabase로 교체)
  useDragReorder.ts        드래그 정렬 커스텀 훅
  adminAuth.ts            관리자 인증 스텁 (보안 주석 포함)
middleware.example.ts     관리자 라우트 서버 보호 예시 (이름 바꿔서 활성화)
```
