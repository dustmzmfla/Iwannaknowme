import type { ReactNode } from "react";

// 질문자/답변자 화면 전용 레이아웃 — 데스크톱에서도 폰 화면처럼 좁고 긴 카드로 보여줍니다.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex justify-center">
      <div className="w-full max-w-[460px] min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
