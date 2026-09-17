"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { StepBar } from "@/components/ui/StepBar";
import { Button } from "@/components/ui/Button";
import {
  ConsentCheckboxes,
  ConsentState,
  isConsentValid,
} from "@/components/ui/ConsentCheckboxes";
import { writeJSON } from "@/lib/storage";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [consent, setConsent] = useState<ConsentState>({
    termsAgreed: false,
    privacyRequiredAgreed: false,
    privacyOptionalAgreed: false,
  });

  const canProceed = name.trim().length > 0 && isConsentValid(consent);

  function handleNext() {
    // 실제 서비스에서는 여기서 supabase.auth.signInWithOAuth({ provider: 'kakao' }) 호출.
    // 동의 시각은 서버에서 AppUser.consent 필드에 기록해야 함 (분쟁 발생 시 증빙 자료).
    writeJSON("iwkm_draft_name", name.trim());
    writeJSON("iwkm_draft_consent", { ...consent, agreedAt: new Date().toISOString() });
    router.push("/build");
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/" />
      <StepBar step={1} />
      <h2 className="font-display text-2xl mb-1.5">먼저, 이름부터</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        프로토타입이라 카카오 로그인 대신 이름만 받을게요. 실제 서비스에선 카카오톡으로
        바로 시작해요.
      </p>

      <div className="mb-4">
        <label className="block text-[13px] text-ink-soft mb-2">이름 또는 닉네임</label>
        <input
          type="text"
          value={name}
          maxLength={12}
          onChange={(e) => setName(e.target.value)}
          placeholder="예) 지수"
          className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3 focus:border-accent"
        />
      </div>

      <div className="bg-paper-card2 border border-black/10 rounded-xl p-4 mb-4">
        <ConsentCheckboxes value={consent} onChange={setConsent} />
      </div>

      <div className="mt-auto pt-5">
        <Button onClick={handleNext} disabled={!canProceed}>
          다음
        </Button>
      </div>
    </section>
  );
}
