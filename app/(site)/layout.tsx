import type { ReactNode } from "react";
import { AdminQuickLink } from "@/components/layout/AdminQuickLink";

// 질문자/답변자 화면 전용 레이아웃 — 데스크톱에서도 폰 화면처럼 좁고 긴 카드로 보여줍니다.
// 햄버거 메뉴는 제거했고, 관리자 계정으로 로그인했을 때만 같은 자리에 관리자 바로가기 버튼이 뜹니다.
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex justify-center">
      <AdminQuickLink />
      <div className="w-full max-w-[460px] min-h-screen flex flex-col">{children}</div>
    </div>
  );
}
