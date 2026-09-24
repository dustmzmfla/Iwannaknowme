"use client";

import { useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { isValidCouponCode, redeemCode } from "@/lib/coupons";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function CodeInputPage() {
  const { showToast } = useToast();
  const { refresh } = useAuth();
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setError("코드를 입력해줘.");
      return;
    }
    if (!isValidCouponCode(trimmed)) {
      setError("코드는 영문+숫자 조합으로 15자 이하여야 해요.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await redeemCode(trimmed);
      if (result.kind === "subscription") {
        showToast("유료회원으로 업그레이드 되었어요! 🎉");
        await refresh(); // 햄버거 메뉴 프로필의 등급 표시를 바로 갱신
      } else {
        showToast(`${result.discountRate}% 할인 쿠폰이 등록되었어요!`);
      }
      setCode("");
    } catch (e: any) {
      setError(e?.message ?? "등록하지 못했어요. 잠시 후 다시 시도해줘.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton />

      <h2 className="font-display text-2xl mb-5">프로모션 코드 입력</h2>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value);
            if (error) setError(null);
          }}
          placeholder="코드를 입력하세요"
          maxLength={15}
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          className="border border-black/15 rounded-xl px-3.5 py-3 text-sm bg-white tracking-wide"
        />

        {error && <p className="text-xs text-accent font-bold">{error}</p>}

        <Button type="submit" disabled={submitting}>
          {submitting ? "등록 중..." : "등록"}
        </Button>

        <p className="text-[12px] text-ink-soft leading-relaxed mt-1">
          * 코드는 영문+숫자이며 대소문자 구분이 있습니다.
        </p>
      </form>
    </section>
  );
}
