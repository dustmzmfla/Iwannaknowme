"use client";

import { useEffect, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { createClient } from "@/lib/supabase/client";

// 카카오 디벨로퍼스 키 + Supabase Kakao Provider 연동이 아직 안 끝났으면 true로 둡니다.
// true일 때는 실제 카카오 로그인 창 대신, Supabase 익명(테스트) 로그인으로 바로 넘어갑니다.
// 카카오 연동이 끝나면 이 값을 false로 바꾸세요. 그러면 원래의 실제 카카오 로그인으로 동작합니다.
const KAKAO_NOT_READY = false;

async function startLogin(): Promise<string | null> {
  const supabase = createClient();

  if (KAKAO_NOT_READY) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) return error.message;
    // 테스트 로그인은 화면 흐름 확인용이라 동의 화면 없이 바로 동의 완료 처리합니다.
    await supabase.rpc("complete_signup", {
      p_terms_agreed: true,
      p_privacy_required_agreed: true,
      p_privacy_optional_agreed: false,
      p_birth_date: null,
    });
    window.location.href = "/";
    return null;
  }

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
  return error ? error.message : null;
}

/**
 * 이 페이지는 화면을 보여주기 위한 곳이 아니라, 카카오 로그인으로 즉시 넘어가기 위한
 * 중간 다리입니다. 약관 동의는 카카오 로그인이 끝난 뒤 "처음 로그인한 사람에게만"
 * /login/consent 에서 한 번 받습니다 — 이미 가입한 회원은 그 화면 없이 바로
 * 메인으로 돌아갑니다 (app/auth/callback/route.ts 참고).
 */
export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    startLogin().then((message) => {
      if (cancelled) return;
      if (message) {
        console.error("[로그인 실패]", message);
        setError(message);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function retry() {
    setError(null);
    setLoading(true);
    startLogin().then((message) => {
      if (message) {
        console.error("[로그인 실패]", message);
        setError(message);
      }
      setLoading(false);
    });
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/" />
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
        {error ? (
          <>
            <p className="text-sm text-accent font-bold">카카오 로그인을 시작하지 못했어요.</p>
            <p className="text-xs text-ink-soft leading-relaxed">{error}</p>
            <button onClick={retry} className="mt-2 text-sm font-bold underline text-accent">
              다시 시도하기
            </button>
          </>
        ) : (
          <p className="text-sm text-ink-soft">{loading ? "카카오 로그인으로 이동 중..." : ""}</p>
        )}
      </div>
    </section>
  );
}
