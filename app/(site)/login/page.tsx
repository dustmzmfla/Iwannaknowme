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

// 카카오 디벨로퍼스 키 + Supabase Kakao Provider 연동이 아직 안 끝났으면 true로 둡니다.
// true일 때는 버튼을 눌러도 실제 카카오 로그인 창 대신, Supabase 익명(테스트) 로그인으로
// 바로 다음 화면(/build)으로 넘어갑니다 — 화면 흐름을 미리 테스트할 수 있도록 하기 위함입니다.
// 카카오 연동이 끝나면 이 값을 false로 바꾸세요. 그러면 원래의 실제 카카오 로그인으로 동작합니다.
const KAKAO_NOT_READY = false;

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

    if (KAKAO_NOT_READY) {
      // ── 임시 테스트 로그인 (카카오 연동 전) ──────────────────────────
      // Supabase 대시보드 > Authentication > Sign In / Providers 에서
      // "Anonymous sign-ins"를 켜둬야 동작합니다.
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInAnonymously();

      if (signInError) {
        setLoading(false);
        console.error("[임시 로그인 실패]", signInError);
        alert(
          `임시 로그인을 시작하지 못했어요.\n\n[실제 오류 메시지]\n${signInError.message}\n\n(status: ${(signInError as any).status ?? "unknown"})\n\n브라우저 개발자도구 Console 탭에도 자세한 내용이 출력됐어요.`
        );
        return;
      }

      await supabase.rpc("complete_signup", {
        p_terms_agreed: consent.termsAgreed,
        p_privacy_required_agreed: consent.privacyRequiredAgreed,
        p_privacy_optional_agreed: consent.privacyOptionalAgreed,
        p_birth_date: null,
      });

      window.location.href = "/";
      return;
    }

    // ── 실제 카카오 로그인 (KAKAO_NOT_READY = false 일 때) ────────────
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
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/`,
        // 이메일(account_email)은 카카오 동의항목에 별도 설정(및 비즈 인증)이 필요해서
        // KOE205 오류의 흔한 원인이 됩니다. 이 앱은 이메일을 쓰지 않으니
        // 닉네임/프로필사진만 명시적으로 요청해서 이 문제를 피합니다.
        scopes: "profile_nickname profile_image",
      },
    });

    if (error) {
      setLoading(false);
      console.error("[카카오 로그인 실패]", error);
      alert(
        `카카오 로그인을 시작하지 못했어요.\n\n[실제 오류 메시지]\n${error.message}`
      );
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
