"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

// 카카오 디벨로퍼스 키 + Supabase Kakao Provider 연동이 아직 안 끝났으면 true로 둡니다.
// true일 때는 실제 카카오 로그인 창 대신, Supabase 익명(테스트) 로그인으로 바로 넘어갑니다.
// 카카오 연동이 끝나면 이 값을 false로 바꾸세요. 그러면 원래의 실제 카카오 로그인으로 동작합니다.
const KAKAO_NOT_READY = false;

async function startLogin(router: ReturnType<typeof useRouter>): Promise<string | null> {
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
    router.replace("/");
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
 * 카카오 로그인으로 넘어가는 다리 역할을 하는 페이지입니다. 페이지에 들어오면
 * 자동으로 카카오 로그인을 시도하지만, 카카오톡/인스타그램 등 인앱 브라우저나
 * 팝업 차단 설정에 따라 이 자동 이동이 조용히 막히는 경우가 있어서(그러면 화면이
 * 텅 빈 채로 멈춰있는 것처럼 보입니다), 화면 전체를 가리는 로딩 오버레이 대신
 * 항상 눌러서 직접 진행할 수 있는 카카오 버튼을 같이 보여줍니다 — 자동으로 잘
 * 넘어가면 사용자는 이 버튼을 볼 새도 없이 이동하고, 자동 이동이 막힌 경우에만
 * 버튼을 눌러 수동으로 진행하면 됩니다.
 *
 * 약관 동의는 카카오 로그인이 끝난 뒤 "처음 로그인한 사람에게만" /login/consent
 * 에서 한 번 받습니다 — 이미 가입한 회원은 그 화면 없이 바로 메인으로 돌아갑니다
 * (app/auth/callback/route.ts 참고).
 */
export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    startLogin(router).then((message) => {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleManualLogin() {
    if (loading) return;
    setError(null);
    setLoading(true);
    startLogin(router).then((message) => {
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
      <div className="flex-1 flex flex-col items-center justify-center text-center gap-4">
        <p className="font-display text-xl">카카오로 3초만에 시작</p>

        {error ? (
          <>
            <p className="text-sm text-accent font-bold">카카오 로그인을 시작하지 못했어요.</p>
            <p className="text-xs text-ink-soft leading-relaxed">{error}</p>
          </>
        ) : (
          <p className="text-[13px] text-ink-soft leading-relaxed max-w-[260px]">
            {loading
              ? "카카오로 이동하는 중이야. 화면이 그대로면 아래 버튼을 눌러줘."
              : "아래 버튼을 눌러 카카오 로그인을 시작해줘."}
          </p>
        )}

        <Button
          variant="kakao"
          onClick={handleManualLogin}
          disabled={loading}
          className="max-w-[260px]"
        >
          {loading ? "이동 중..." : "카카오로 로그인하기"}
        </Button>
      </div>
    </section>
  );
}
