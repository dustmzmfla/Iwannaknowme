import type { ReactNode } from "react";
import Link from "next/link";
import { getCurrentAdmin } from "@/lib/adminAuth";

// middleware.ts가 이미 role === "admin" 이 아니면 이 레이아웃 자체를 렌더링하지 못하게
// 막고 있습니다 (DB의 RLS와 함께 이중 방어). 여기서는 관리자 이름 표시 + 내비게이션만 담당합니다.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();

  return (
    <div className="min-h-screen w-full bg-paper flex flex-col">
      <header className="bg-ink text-paper-card px-6 py-4 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-5 flex-wrap">
          <Link href="/admin" className="font-display text-lg">
            나를 알려줘 관리자
          </Link>
          <nav className="flex items-center gap-4 text-sm font-bold">
            <Link href="/admin" className="opacity-80 hover:opacity-100">
              유저 관리
            </Link>
            <Link href="/admin/questions" className="opacity-80 hover:opacity-100">
              카테고리·질문 관리
            </Link>
            <Link href="/admin/admins" className="opacity-80 hover:opacity-100">
              관리자 계정
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-3 text-xs text-paper-card/70">
          <span>{admin?.label ?? "관리자"}</span>
          <Link href="/" className="underline">
            서비스로 돌아가기
          </Link>
        </div>
      </header>
      <main className="flex-1 px-6 py-8 max-w-5xl w-full mx-auto">{children}</main>
    </div>
  );
}
