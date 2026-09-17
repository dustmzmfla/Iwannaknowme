import type { ReactNode } from "react";
import Link from "next/link";

// ⚠️ 실서비스에서는 이 layout이 렌더링되기 전에 middleware.ts에서
// 세션의 role이 'admin'인지 서버에서 검증해야 합니다.
// (자세한 내용은 lib/adminAuth.ts 주석 참고)
export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-paper flex flex-col">
      <header className="bg-ink text-paper-card px-6 py-4 flex items-center justify-between">
        <Link href="/admin" className="font-display text-lg">
          나를 알려줘 관리자
        </Link>
        <span className="text-xs text-paper-card/70">데모 모드 · 실제 배포 전 서버 인증 필수</span>
      </header>
      <main className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">{children}</main>
    </div>
  );
}
