import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Gaegu, Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const gaegu = Gaegu({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-gaegu",
});

const noto = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
  variable: "--font-noto",
});

export const metadata: Metadata = {
  title: "너에게 난? — I wanna know me",
};

// 루트 레이아웃은 폰트/전역 스타일만 담당합니다.
// 모바일 폭 프레임은 (site) 라우트 그룹에서, 관리자 전용 레이아웃은 admin/layout.tsx에서 각각 적용합니다.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${gaegu.variable} ${noto.variable}`}>
      <body className="min-h-screen font-body text-ink antialiased">{children}</body>
    </html>
  );
}
