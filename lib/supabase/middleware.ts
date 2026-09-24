import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const LOGIN_REQUIRED_PREFIXES = ["/build", "/my", "/inquiries", "/code"];

/**
 * 매 요청마다 Supabase 세션 쿠키를 갱신합니다 (Next.js 미들웨어 표준 패턴).
 * - /build, /my 하위 경로: 로그인 안 했으면 /login으로.
 * - /manage-x7k29q 하위 경로: 로그인은 물론 role === "admin" 인지까지 확인해서 아니면 홈으로.
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

  if (isAdminRoute && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  return supabaseResponse;
}
