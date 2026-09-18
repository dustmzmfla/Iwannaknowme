"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";

/** 예전 햄버거 버튼이 있던 자리(우측 상단 고정)에, 관리자 계정으로 로그인했을 때만 보이는
 * 빠른 이동 버튼. 누르면 바로 관리자 페이지(/admin)로 이동합니다. */
export function AdminQuickLink() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();

  if (loading || !isAdmin) return null;

  return (
    <button
      onClick={() => router.push("/admin")}
      className="fixed top-4 right-4 z-30 h-10 px-4 rounded-full bg-ink text-paper-card text-[13px] font-bold shadow-md active:scale-95 transition"
    >
      관리자
    </button>
  );
}
