import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

const CONSENT_COOKIE = "iwkm_pending_consent";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const cookieStore = await cookies();
      const raw = cookieStore.get(CONSENT_COOKIE)?.value;
      if (raw) {
        try {
          const consent = JSON.parse(decodeURIComponent(raw)) as {
            termsAgreed: boolean;
            privacyRequiredAgreed: boolean;
            privacyOptionalAgreed: boolean;
            birthDate: string | null;
          };
          await supabase.rpc("complete_signup", {
            p_terms_agreed: consent.termsAgreed,
            p_privacy_required_agreed: consent.privacyRequiredAgreed,
            p_privacy_optional_agreed: consent.privacyOptionalAgreed,
            p_birth_date: consent.birthDate,
          });
        } catch {
          // 쿠키가 깨졌으면 무시
        } finally {
          cookieStore.delete(CONSENT_COOKIE);
        }
      }
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=oauth`);
}
