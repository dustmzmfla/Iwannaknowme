"use client";

import { useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { StepBar } from "@/components/ui/StepBar";
import { Button } from "@/components/ui/Button";
import {
  ConsentCheckboxes,
  ConsentState,
  isConsentValid,
} from "@/components/ui/ConsentCheckboxes";
import { createClient } from "@/lib/supabase/client";

const CONSENT_COOKIE = "iwkm_pending_consent";

export default function LoginPage() {
  const [consent, setConsent] = useState<ConsentState>({
    termsAgreed: false,
    privacyRequiredAgreed: false,
    privacyOptionalAgreed: false,
  });
  const [loading, setLoading] = useState(false);

  const canProceed = isConsentValid(consent);

  async function handleKakaoLogin() {
    if (!canProceed || loading) return;
    setLoading(true);

    const payload = encodeURIComponent(
      JSON.stringify({
        termsAgreed: consent.termsAgreed,
        privacyRequiredAgreed: consent.privacyRequiredAgreed,
        privacyOptionalAgreed: consent.privacyOptionalAgreed,
        birthDate: null,
      })
    );
    document.cookie = `${CONSENT_COOKIE}=${payload}; path=/; max-age=600; samesite=lax`;

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/build` },
    });

    if (error) {
      setLoading(false);
      alert("카카오 로그인을 시작하지 못했어요. 잠시 후 다시 시도해주세요.");
    }
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/" />
      <StepBar step={1} />
      <h2 className="font-display text-2xl mb-1.5">카카오로 3초만에 시작</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        카카오 계정으로 로그인하면 프로필 사진과 닉네임을 그대로 가져와서 질문지에
        표시해요. 별도 회원가입은 없어요.
      </p>

      <div className="bg-paper-card2 border border-black/10 rounded-xl p-4 mb-4">
        <ConsentCheckboxes value={consent} onChange={setConsent} />
      </div>

      <div className="mt-auto pt-5">
        <Button variant="kakao" onClick={handleKakaoLogin} disabled={!canProceed || loading}>
          {loading ? "이동 중..." : "카카오로 시작하기"}
        </Button>
      </div>
    </section>
  );
}
