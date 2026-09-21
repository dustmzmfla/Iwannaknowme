import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * 카카오 로그인 콜백. 세션을 교환한 뒤, 이 유저가 이미 약관에 동의한 "기존 회원"인지
 * "이번이 첫 로그인"인지 profiles.terms_agreed_at 유무로 판단합니다.
 * - 기존 회원: 곧바로 next(기본 "/")로 랜딩 — 매번 동의 화면이 뜨던 문제를 해결합니다.
 * - 첫 로그인: /login/consent 에서 딱 한 번만 약관 동의를 받은 뒤 next로 보냅니다.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("terms_agreed_at")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile?.terms_agreed_at) {
          return NextResponse.redirect(
            `${origin}/login/consent?next=${encodeURIComponent(next)}`
          );
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
