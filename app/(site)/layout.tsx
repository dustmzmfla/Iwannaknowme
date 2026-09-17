import type { ReactNode } from "react";
import { SiteHeader } from "@/components/layout/SiteHeader";

// 질문자/답변자 화면 전용 레이아웃 — 데스크톱에서도 폰 화면처럼 좁고 긴 카드로 보여줍니다.
// 로그인한 사람에게는 우측 상단 햄버거 버튼(SiteHeader)이 뜹니다.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex justify-center">
      <SiteHeader />
      <div className="w-full max-w-[460px] min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
