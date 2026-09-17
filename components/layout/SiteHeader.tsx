"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { NavDrawer } from "./NavDrawer";

/** 로그인한 사람에게만 보이는 우측 상단 햄버거 버튼 + 슬라이드 네비게이션. */
export function SiteHeader() {
  const { profile, isAdmin, loading } = useAuth();
  const [open, setOpen] = useState(false);

  if (loading || !profile) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="메뉴 열기"
        className="fixed top-4 right-4 z-30 w-10 h-10 rounded-full bg-paper-card border border-black/10 shadow-md flex items-center justify-center active:scale-95 transition"
      >
        <span className="flex flex-col gap-[3px]">
          <span className="block w-4 h-[2px] bg-ink rounded-full" />
          <span className="block w-4 h-[2px] bg-ink rounded-full" />
          <span className="block w-4 h-[2px] bg-ink rounded-full" />
        </span>
      </button>
      <NavDrawer open={open} onClose={() => setOpen(false)} profile={profile} isAdmin={isAdmin} />
    </>
  );
}
