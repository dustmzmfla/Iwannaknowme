import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Gaegu, Noto_Sans_KR, Black_Han_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { AdsenseScript } from "@/components/ads/AdsenseScript";

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

// 홈 화면의 리퀴드 글라스 타이틀 전용 폰트
const blackHan = Black_Han_Sans({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-black-han",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const adsenseAccount = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const searchConsoleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "내가 누구게? — Who Am I?",
    template: "%s | 내가 누구게?",
  },
  description:
    "친한 친구에게도 차마 못 물어본 질문을 익명으로 던지고 솔직한 답을 받아보는 질문지 서비스, 내가 누구게?.",
  keywords: ["내가 누구게?", "익명 질문", "친구 질문", "질문지 만들기", "Who Am I?"],
  openGraph: {
    title: "내가 누구게? — Who Am I?",
    description: "친한 친구에게도 차마 못 물어본 질문을 익명으로 던지고 솔직한 답을 받아보세요.",
    url: siteUrl,
    siteName: "내가 누구게?",
    locale: "ko_KR",
    type: "website",
  },
  robots: { index: true, follow: true },
  ...(searchConsoleVerification ? { verification: { google: searchConsoleVerification } } : {}),
  ...(adsenseAccount ? { other: { "google-adsense-account": adsenseAccount } } : {}),
};

// 루트 레이아웃은 폰트/전역 스타일 + 로그인 상태 제공(AuthProvider) + 애드센스 스크립트를 담당합니다.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${gaegu.variable} ${noto.variable} ${blackHan.variable}`}>
      <body className="min-h-screen font-body text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
        <AdsenseScript />
      </body>
    </html>
  );
}
