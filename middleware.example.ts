import { NextRequest, NextResponse } from "next/server";

// ⚠️ 이 미들웨어는 실제로 동작하는 인증 코드가 아니라 "여기에 뭘 넣어야 하는지" 보여주는 예시입니다.
//
// 실서비스 전환 시 해야 할 일:
// 1. Supabase 세션 쿠키를 읽어서 로그인 여부 확인 (@supabase/ssr의 createServerClient 사용)
// 2. profiles 테이블(혹은 JWT의 custom claim)에서 role === 'admin' 인지 확인
// 3. 아니라면 /admin 이하 요청을 로그인 페이지나 403 페이지로 리다이렉트
//
// 프론트엔드 라우팅(예: admin/layout.tsx에서 role 체크)만으로는 절대 충분하지 않습니다.
// 미들웨어 없이는 누군가 브라우저 주소창에 /admin을 직접 입력해서 우회할 수 있고,
// API Route를 직접 호출해서 데이터를 가져갈 수도 있습니다.
// 반드시 서버(미들웨어 또는 각 Route Handler 내부) + DB의 RLS 정책, 이중으로 막아야 합니다.
export function middleware(request: NextRequest) {
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");
  if (!isAdminRoute) return NextResponse.next();

  // TODO: 아래를 실제 세션 검증 로직으로 교체하세요.
  const isVerifiedAdmin = false; // 항상 false — 실제 구현 전까지는 관리자 페이지를 막아두는 편이 안전합니다.

  if (!isVerifiedAdmin) {
    return NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
