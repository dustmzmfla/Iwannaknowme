"use client";

import { useRouter } from "next/navigation";

/**
 * 모든 화면 공통 뒤로가기 버튼.
 * ⚠️(2026-09): 예전엔 router.back()으로 브라우저 히스토리를 그대로 썼는데, 이
 * 화면에 어떻게 들어왔는지(딥링크, 새로고침, 리다이렉트 등)에 따라 히스토리가
 * 없거나 엉뚱한 곳(심하면 앱 밖의 이전 사이트)으로 돌아가는 경우가 있어서
 * fallbackHref로 고정 경로를 쓰도록 바꿨었습니다.
 *
 * ⚠️(2026-09, 재변경): 그런데 그 결과 "뒤로가기"가 실제 방문 흐름과 상관없이
 * 항상 같은 화면으로 고정돼버려서, 유저가 실제로 오간 경로를 무시하는 문제가
 * 생겼습니다. 그래서 다시 router.back()을 기본으로 쓰되, 이 앱으로 들어오기
 * 전(딥링크, 새로고침 등으로 히스토리가 없는 경우)에만 fallbackHref로 안전하게
 * 대체하도록 절충했습니다.
 */
export function BackButton({ fallbackHref = "/" }: { fallbackHref?: string }) {
  const router = useRouter();
  const handleClick = () => {
    // history.length가 1 이하면 이 탭에서 갈 곳이 없다는 뜻(딥링크로 바로 들어온 경우 등)
    // 이라 안전하게 fallbackHref로 이동하고, 그 외에는 실제로 방문했던 이전 화면으로 돌아갑니다.
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackHref);
    }
  };
  return (
    <button
      onClick={handleClick}
      aria-label="뒤로가기"
      className="w-[38px] h-[38px] rounded-full border-2 border-transparent bg-paper-card flex items-center justify-center mb-4 active:scale-95 active:border-accent focus-visible:border-accent transition"
    >
      ←
    </button>
  );
}
