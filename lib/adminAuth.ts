// ⚠️ 데모용 스텁입니다. 지금은 그냥 "현재 로그인한 관리자"를 하드코딩해뒀습니다.
//
// 실서비스 전환 시 반드시:
// 1. /admin 이하 모든 라우트를 Next.js 미들웨어(middleware.ts)에서 세션 검사하고,
//    admin role이 아니면 로그인 페이지로 리다이렉트 (프론트 라우팅만으로는 절대 막히지 않습니다 —
//    누구나 /admin URL을 직접 입력해서 접근할 수 있기 때문에 서버 검증이 필수입니다).
// 2. Supabase 기준으로는 profiles 테이블에 role 컬럼을 두고,
//    RLS 정책에서 "role = 'admin'인 세션만 다른 유저의 row를 SELECT/UPDATE 가능"하도록
//    DB 레벨에서도 이중으로 강제하세요. 프론트 체크만 믿으면 API를 직접 호출해서 우회당할 수 있습니다.
// 3. 영구 삭제(purge) 같은 고위험 액션은 super_admin 등 더 높은 권한 등급으로 한 번 더 분리하는 걸 권장합니다.
export const CURRENT_ADMIN = {
  id: "admin_demo_1",
  label: "관리자(데모)",
};
