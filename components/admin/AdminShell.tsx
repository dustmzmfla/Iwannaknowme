"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getPendingInquiryCount } from "@/lib/inquiries";
import { useAuth } from "@/lib/auth/AuthProvider";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  exact?: boolean;
  showBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/manage-x7k29q", label: "대시보드", icon: "📊", exact: true },
  { href: "/manage-x7k29q/users", label: "유저 관리", icon: "👥" },
  { href: "/manage-x7k29q/inquiries", label: "문의사항", icon: "📮", showBadge: true },
  { href: "/manage-x7k29q/questions", label: "카테고리·질문 관리", icon: "📝" },
  { href: "/manage-x7k29q/admins", label: "관리자 계정", icon: "🔑" },
];

const POLL_MS = 20000;
const COLLAPSE_KEY = "iwkm_admin_sidebar_collapsed";

/**
 * ERP 스타일 관리자 셸 — 왼쪽 여닫을 수 있는 네비게이션 + 상단바(알림벨) + 콘텐츠 영역.
 * 문의 알림 배지는 실시간 구독이 아니라 폴링(20초 간격) + 창 포커스 시 갱신으로 구현했습니다 —
 * Supabase Realtime replication 설정 없이도 바로 동작하고, 관리자 화면 특성상 이 정도
 * 지연(최대 20초)은 충분히 "거의 실시간"으로 느껴집니다.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const adminLabel = profile?.name ?? "관리자";
  const [collapsed, setCollapsed] = useState(false);
  const [pending, setPending] = useState(0);

  const refreshPending = useCallback(() => {
    getPendingInquiryCount()
      .then(setPending)
      .catch(() => {});
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(COLLAPSE_KEY) === "1") setCollapsed(true);
    } catch {
      // 무시 — 기본값(펼침)으로 시작합니다.
    }
  }, []);

  useEffect(() => {
    refreshPending();
    const interval = setInterval(refreshPending, POLL_MS);
    const onFocus = () => refreshPending();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, [refreshPending]);

  useEffect(() => {
    if (pathname.startsWith("/manage-x7k29q/inquiries")) refreshPending();
  }, [pathname, refreshPending]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // 무시
      }
      return next;
    });
  }

  return (
    // 오른쪽 콘텐츠 칸 높이를 100vh로 고정하고, 그 안에서만 스크롤되게 합니다
    // (h-screen + overflow-hidden으로 바깥은 고정, main에만 overflow-y-auto).
    <div className="h-screen overflow-hidden flex bg-[#F4F4F1] text-[#22201D]">
      <aside
        className={`shrink-0 bg-[#1E1B18] text-white/80 flex flex-col overflow-y-auto transition-[width] duration-150 ${
          collapsed ? "w-[60px]" : "w-[216px]"
        }`}
      >
        <div className="h-14 flex items-center px-4 border-b border-white/10 font-bold text-[15px] whitespace-nowrap overflow-hidden">
          {collapsed ? "내" : "내가 누구게? 관리자"}
        </div>
        <nav className="flex-1 py-3">
          {NAV_ITEMS.map((item) => {
            const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={`relative flex items-center gap-3 px-4 py-2.5 text-sm font-medium ${
                  active ? "bg-white/10 text-white" : "text-white/60 hover:bg-white/5 hover:text-white/90"
                }`}
              >
                <span className="text-base leading-none shrink-0">{item.icon}</span>
                {!collapsed && <span className="truncate">{item.label}</span>}
                {item.showBadge && pending > 0 && (
                  <span
                    className={
                      collapsed
                        ? "absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent"
                        : "ml-auto shrink-0 text-[10px] font-bold bg-accent text-white rounded-full px-1.5 py-0.5"
                    }
                  >
                    {collapsed ? "" : pending > 9 ? "9+" : pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="px-4 py-3 border-t border-white/10 text-xs text-white/45 hover:text-white/80"
        >
          {collapsed ? "↩" : "← 서비스로 돌아가기"}
        </Link>
      </aside>

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <header className="h-14 shrink-0 bg-white border-b border-black/10 flex items-center gap-2 px-4">
          <button
            onClick={toggleCollapsed}
            aria-label="사이드바 접기/펼치기"
            className="w-8 h-8 rounded-md hover:bg-black/5 flex items-center justify-center text-base"
          >
            ☰
          </button>
          <div className="flex-1" />
          <button
            onClick={() => router.push("/manage-x7k29q/inquiries")}
            className="relative w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center text-lg"
            aria-label="문의 알림"
            title={pending > 0 ? `답변 대기 문의 ${pending}건` : "새 문의 없음"}
          >
            <span className={pending > 0 ? "animate-pulse" : ""}>🔔</span>
            {pending > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-[3px] text-[10px] leading-4 font-bold text-white bg-accent rounded-full text-center">
                {pending > 9 ? "9+" : pending}
              </span>
            )}
          </button>
          <span className="text-sm font-bold text-black/70 ml-1 whitespace-nowrap">{adminLabel}</span>
        </header>
        <main className="flex-1 min-h-0 p-6 overflow-y-auto overflow-x-auto">{children}</main>
      </div>
    </div>
  );
}
