import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

// ⚠️(2026-09 성능 최적화): 예전엔 거의 모든 경로에서 매번 Supabase 세션 검증
// (auth.getUser() 네트워크 왕복)을 했습니다 — 홈/소개/이용약관처럼 로그인이 필요 없는
// 공개 페이지까지 매 이동마다 느려지는 원인이었습니다. 실제로 로그인 확인이 필요한
// 경로(/build, /my, /inquiries, /admin)만 매처에 남겨서 나머지 페이지는 미들웨어를
// 아예 타지 않게 했습니다.
export const config = {
  matcher: ["/build/:path*", "/my/:path*", "/inquiries/:path*", "/admin/:path*"],
};
