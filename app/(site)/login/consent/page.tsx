"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  ConsentCheckboxes,
  ConsentState,
  isConsentValid,
} from "@/components/ui/ConsentCheckboxes";
import { useAuth } from "@/lib/auth/AuthProvider";
import { LoadingOverlay } from "@/components/ui/LoadingOverlay";
import { createClient } from "@/lib/supabase/client";

/**
 * 카카오 로그인이 끝난 "직후"에만 거치는 화면입니다. 이미 약관에 동의한 회원이라면
 * app/auth/callback/route.ts 가 애초에 이 페이지로 보내지 않고 바로 메인으로
 * 보내기 때문에, 여기 도달했다는 건 곧 "이번이 처음 로그인"이라는 뜻입니다.
 */
export default function LoginConsentPage() {
  const router = useRouter();
  const { loading, profile, refresh } = useAuth();

  const [next, setNext] = useState("/");
  const [consent, setConsent] = useState<ConsentState>({
    termsAgreed: false,
    privacyRequiredAgreed: false,
    privacyOptionalAgreed: false,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const n = new URLSearchParams(window.location.search).get("next");
    if (n) setNext(n);
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!profile) {
      router.replace("/login");
      return;
    }
    // 이미 동의를 마친 회원이 어떤 경로로든 이 화면에 다시 들어온 경우 (뒤로가기 등)
    // 다시 물어보지 않고 바로 목적지로 보냅니다.
    if (profile.consent.termsAgreedAt) {
      router.replace(next);
    }
  }, [loading, profile, next, router]);

  const canProceed = isConsentValid(consent);

  async function handleSubmit() {
    if (!canProceed || submitting) return;
    setSubmitting(true);
    setError(null);
    const supabase = createClient();
    const { error: rpcError } = await supabase.rpc("complete_signup", {
      p_terms_agreed: consent.termsAgreed,
      p_privacy_required_agreed: consent.privacyRequiredAgreed,
      p_privacy_optional_agreed: consent.privacyOptionalAgreed,
      p_birth_date: null,
    });
    if (rpcError) {
      setSubmitting(false);
      setError(rpcError.message);
      return;
    }
    await refresh();
    router.replace(next);
  }

  if (loading || !profile) {
    return <LoadingOverlay message="정보를 불러오는 중" />;
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <h2 className="font-display text-2xl mb-1.5">마지막으로 약관에 동의해줘</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        처음 로그인했을 때만 한 번 확인하면 돼요. 다음 로그인부터는 바로 메인으로
        들어와요.
      </p>

      <div className="bg-paper-card2 border border-black/10 rounded-xl p-4 mb-4">
        <ConsentCheckboxes value={consent} onChange={setConsent} />
      </div>

      {error && <p className="text-xs text-accent font-bold mb-2">{error}</p>}

      <div className="mt-auto pt-5">
        <Button onClick={handleSubmit} disabled={!canProceed || submitting}>
          {submitting ? "확인 중..." : "동의하고 시작하기"}
        </Button>
      </div>
    </section>
  );
}
