import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { Gaegu, Noto_Sans_KR, Black_Han_Sans } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth/AuthProvider";
import { ToastProvider } from "@/components/ui/Toast";
import { AdsenseScript } from "@/components/ads/AdsenseScript";
import { VisitTracker } from "@/components/analytics/VisitTracker";

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
    description: "나도 모르는 내 모습, 네가 알려줄래?",
    url: siteUrl,
    siteName: "내가 누구게?",
    locale: "ko_KR",
    type: "website",
    // 카카오톡 등에서 링크를 공유할 때 보여줄 미리보기 이미지입니다.
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "내가 누구게? — Who Am I?",
      },
    ],
  },
  robots: { index: true, follow: true },
  ...(searchConsoleVerification ? { verification: { google: searchConsoleVerification } } : {}),
  ...(adsenseAccount ? { other: { "google-adsense-account": adsenseAccount } } : {}),
};

// iOS/안드로이드 브라우저는 input 등 폼 요소의 글자 크기가 16px보다 작으면
// 포커스할 때 화면을 자동으로 확대(zoom)합니다. maximumScale/userScalable을
// 고정해서 그 확대 동작 자체를 막아, 인풋을 눌러도 화면이 줌인되지 않고
// 바로 입력할 수 있게 합니다.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

// 루트 레이아웃은 폰트/전역 스타일 + 로그인 상태 제공(AuthProvider) + 애드센스 스크립트를 담당합니다.
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko" className={`${gaegu.variable} ${noto.variable} ${blackHan.variable}`}>
      <body className="min-h-screen font-body text-ink antialiased">
        <AuthProvider>
          <ToastProvider>
            <VisitTracker />
            {children}
          </ToastProvider>
        </AuthProvider>
        <AdsenseScript />
      </body>
    </html>
  );
}
