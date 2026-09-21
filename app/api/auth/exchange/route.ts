import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * app/auth/callback/route.ts가 먼저 그려서 보여주는 로딩 화면이 뜬 상태에서
 * 호출하는 API입니다. 실제 카카오 세션 교환 + "이미 약관에 동의한 회원인지"
 * 판단은 여기서 처리하고, 어디로 보내야 할지(redirectTo)만 JSON으로 돌려줍니다.
 * (예전에는 이 작업 전부를 route.ts의 GET 핸들러가 302 리다이렉트 전에 끝내야
 * 했는데, 그 동안 브라우저에는 새하얀 빈 화면만 보였습니다.)
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const code = typeof body?.code === "string" ? body.code : null;
  const rawNext = typeof body?.next === "string" ? body.next : "/";
  // next는 반드시 우리 사이트 내부 경로여야 합니다 — 외부 URL로의 오픈 리다이렉트 방지.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/";

  if (!code) {
    return NextResponse.json({ redirectTo: "/login?error=oauth" });
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.json({ redirectTo: "/login?error=oauth" });
  }

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
      return NextResponse.json({
        redirectTo: `/login/consent?next=${encodeURIComponent(next)}`,
      });
    }
  }

  return NextResponse.json({ redirectTo: next });
}
