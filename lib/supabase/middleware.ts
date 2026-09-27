import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_REQUIRED_PREFIXES = ["/build", "/my", "/inquiries", "/code"];

/**
 * 매 요청마다 Supabase 세션 쿠키를 갱신합니다 (Next.js 미들웨어 표준 패턴).
 * - /build, /my 하위 경로: 로그인 안 했으면 /login으로.
 * - /manage-x7k29q 하위 경로: 로그인은 물론 role === "admin" 인지까지 확인해서 아니면 홈으로.
 * - 로그인이 필요한 경로에서: 계정이 정지(status === "suspended")된 유저는
 *   세션을 강제로 끊고 /suspended로 보냅니다 (블랙리스트 실효화 — 관리자 페이지의
 *   "계정 정지"가 단순 표시용 플래그가 아니라 실제로 서비스 이용을 막도록).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAdminRoute = pathname.startsWith("/manage-x7k29q");
  const needsLogin = isAdminRoute || LOGIN_REQUIRED_PREFIXES.some((p) => pathname.startsWith(p));

  if (needsLogin && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (needsLogin && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.status === "suspended") {
      await supabase.auth.signOut();
      const redirectResponse = NextResponse.redirect(new URL("/suspended", request.url));
      supabaseResponse.cookies.getAll().forEach((cookie) => {
        redirectResponse.cookies.set(cookie.name, cookie.value);
      });
      return redirectResponse;
    }

    if (isAdminRoute && profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}
