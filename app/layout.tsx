import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Gaegu, Noto_Sans_KR } from "next/font/google";
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

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
const adsenseAccount = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
const searchConsoleVerification = process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "나를 알려줘 — I wanna know me",
    template: "%s | 나를 알려줘",
  },
  description:
    "친한 친구에게도 차마 못 물어본 질문을 익명으로 던지고 솔직한 답을 받아보는 질문지 서비스, 나를 알려줘.",
  keywords: ["나를 알려줘", "익명 질문", "친구 질문", "질문지 만들기", "I wanna know me"],
  openGraph: {
    title: "나를 알려줘 — I wanna know me",
    description: "친한 친구에게도 차마 못 물어본 질문을 익명으로 던지고 솔직한 답을 받아보세요.",
    url: siteUrl,
    siteName: "나를 알려줘",
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
    <html lang="ko" className={`${gaegu.variable} ${noto.variable}`}>
      <body className="min-h-screen font-body text-ink antialiased">
        <AuthProvider>{children}</AuthProvider>
        <AdsenseScript />
      </body>
    </html>
  );
}
