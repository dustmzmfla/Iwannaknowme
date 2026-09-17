"use client";

import { useRouter } from "next/navigation";

/**
 * 모든 화면 공통 뒤로가기 버튼.
 * Next.js의 router.back()은 브라우저 히스토리를 그대로 사용하므로,
 * 이전 프로토타입에서 직접 구현했던 navHistory 스택이 필요 없어졌습니다.
 */
export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      aria-label="뒤로가기"
      className="w-[38px] h-[38px] rounded-full border-2 border-transparent bg-paper-card flex items-center justify-center mb-4 active:scale-95 active:border-accent focus-visible:border-accent transition"
    >
      ←
    </button>
  );
}
