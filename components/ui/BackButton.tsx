"use client";

import { useRouter } from "next/navigation";

/**
 * 모든 화면 공통 뒤로가기 버튼.
 * ⚠️(2026-09): 예전엔 router.back()으로 브라우저 히스토리를 그대로 썼는데, 이
 * 화면에 어떻게 들어왔는지(딥링크, 새로고침, 리다이렉트 등)에 따라 히스토리가
 * 없거나 엉뚱한 곳(심하면 앱 밖의 이전 사이트)으로 돌아가는 경우가 있었습니다.
 * 그래서 히스토리에 기대지 않고, 각 화면이 자기 흐름상 "이전 화면"이 어디인지를
 * fallbackHref로 직접 지정하고 항상 그 경로로 이동합니다.
 */
export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.push(fallbackHref)}
      aria-label="뒤로가기"
      className="w-[38px] h-[38px] rounded-full border-2 border-transparent bg-paper-card flex items-center justify-center mb-4 active:scale-95 active:border-accent focus-visible:border-accent transition"
    >
      ←
    </button>
  );
}
