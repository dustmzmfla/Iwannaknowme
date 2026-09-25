"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getPendingInquiryCount } from "@/lib/inquiries";
import { useAuth } from "@/lib/auth/AuthProvider";

interface NavItem {
  href: string;
  label: string;
  exact?: boolean;
  showBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/manage-x7k29q", label: "대시보드", exact: true },
  { href: "/manage-x7k29q/users", label: "유저 관리" },
  { href: "/manage-x7k29q/inquiries", label: "문의사항", showBadge: true },
  { href: "/manage-x7k29q/questions", label: "카테고리·질문 관리" },
  { href: "/manage-x7k29q/coupons", label: "쿠폰 관리" },
  { href: "/manage-x7k29q/admins", label: "관리자 계정" },
];

const POLL_MS = 20000;
const COLLAPSE_KEY = "iwkm_admin_sidebar_collapsed";

/**
 * ERP 스타일 관리자 셸 — 왼쪽 여닫을 수 있는 네비게이션 + 상단바(알림벨) + 콘텐츠 영역.
 * 문의 알림 배지는 실시간 구독이 아니라 폴링(20초 간격) + 창 포커스 시 갱신으로 구현했습니다 —
 * Supabase Realtime replication 설정 없이도 바로 동작하고, 관리자 화면 특성상 이 정도
 * 지연(최대 20초)은 충분히 "거의 실시간"으로 느껴집니다.
 *
 * 모바일 대응(2026-09): sm(640px) 미만에서는 사이드바를 기본적으로 화면 밖(off-canvas)에
 * 숨겨두고, 상단 햄버거 버튼을 누르면 오버레이(반투명 배경 + 슬라이드 인)로 열립니다.
 * `collapsed`는 데스크톱 전용(폭 216px ↔ 60px)이고 `mobileOpen`은 모바일 전용(열림/닫힘)
 * 상태라, 둘 다 같은 버튼 하나로 같이 토글해도 각자 sm: 브레이크포인트 안에서만
 * 적용되는 클래스라서 서로 간섭하지 않습니다. 모바일에서 메뉴를 고르면 자동으로 닫히고,
 * 열려있는 동안은 배경 스크롤을 막아서 아래 콘텐츠가 같이 안 움직이게 했습니다.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const adminLabel = profile?.name ?? "관리자";
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  // 페이지 이동(모바일 메뉴에서 링크 클릭)마다 드로어를 자동으로 닫습니다.
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // 모바일 드로어가 열려있는 동안은 뒤쪽 콘텐츠가 스크롤되지 않게 막아둡니다.
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  function toggleSidebar() {
    // 데스크톱에서는 접기/펼치기, 모바일에서는 드로어 열기/닫기 — 버튼 하나로 겸용.
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // 무시
      }
      return next;
    });
    setMobileOpen((prev) => !prev);
  }

  return (
    // 오른쪽 콘텐츠 칸 높이를 100vh로 고정하고, 그 안에서만 스크롤되게 합니다
    // (h-screen + overflow-hidden으로 바깥은 고정, main에만 overflow-y-auto).
    <div className="h-screen overflow-hidden flex bg-[#F4F4F1] text-[#22201D]">
      {/* 모바일 전용 배경 오버레이 — 사이드바가 열려있을 때만 보이고, 누르면 닫힙니다. */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 sm:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        className={`fixed sm:static inset-y-0 left-0 z-40 sm:z-auto shrink-0 bg-[#1E1B18] text-white/80 flex flex-col overflow-y-auto transition-transform sm:transition-[width] duration-200 w-[216px] ${
          collapsed ? "sm:w-[60px]" : "sm:w-[216px]"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full sm:translate-x-0"}`}
      >
        <div className="h-14 shrink-0 flex items-center px-4 border-b border-white/10 font-bold text-[15px] whitespace-nowrap overflow-hidden">
          <span className="sm:hidden">내가 누구게? 관리자</span>
          <span className="hidden sm:inline">{collapsed ? "내" : "내가 누구게? 관리자"}</span>
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
                <span className={collapsed ? "truncate sm:hidden" : "truncate"}>{item.label}</span>
                {item.showBadge && pending > 0 && (
                  <span
                    className={
                      collapsed
                        ? "absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent sm:block hidden"
                        : "ml-auto shrink-0 text-[10px] font-bold bg-accent text-white rounded-full px-1.5 py-0.5"
                    }
                  >
                    {collapsed ? "" : pending > 9 ? "9+" : pending}
                  </span>
                )}
                {/* 접힌 상태에서도 모바일 드로어는 항상 펼쳐진 폭으로 열리므로,
                    배지 숫자가 sm 미만에서는 안 잘리게 별도로 하나 더 보여줍니다. */}
                {collapsed && item.showBadge && pending > 0 && (
                  <span className="ml-auto shrink-0 text-[10px] font-bold bg-accent text-white rounded-full px-1.5 py-0.5 sm:hidden">
                    {pending > 9 ? "9+" : pending}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
        <Link
          href="/"
          className="px-4 py-3 border-t border-white/10 text-xs text-white/45 hover:text-white/80 shrink-0"
        >
          <span className="sm:hidden">← 서비스로 돌아가기</span>
          <span className="hidden sm:inline">{collapsed ? "↩" : "← 서비스로 돌아가기"}</span>
        </Link>
      </aside>

      <div className="flex-1 min-w-0 min-h-0 flex flex-col">
        <header className="h-14 shrink-0 bg-white border-b border-black/10 flex items-center gap-2 px-3 sm:px-4">
          <button
            onClick={toggleSidebar}
            aria-label="사이드바 접기/펼치기"
            className="w-9 h-9 sm:w-8 sm:h-8 rounded-md hover:bg-black/5 flex items-center justify-center text-base shrink-0"
          >
            ☰
          </button>
          <div className="flex-1" />
          <button
            onClick={() => router.push("/manage-x7k29q/inquiries")}
            className="relative w-9 h-9 rounded-full hover:bg-black/5 flex items-center justify-center shrink-0"
            aria-label="문의 알림"
            title={pending > 0 ? `답변 대기 문의 ${pending}건` : "새 문의 없음"}
          >
            {/* 이모지 대신 손그림 느낌의 둥근 종 모양 아웃라인 SVG입니다. */}
            <svg
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
              className={`w-5 h-5 text-[#22201D] ${pending > 0 ? "animate-pulse" : ""}`}
            >
              <path
                d="M12 3.2c-2.4 0-4.3 1.9-4.3 4.3v3.2c0 .8-.3 1.6-.9 2.2l-1 1.1c-.7.8-.2 2.1.9 2.2h10.6c1.1-.1 1.6-1.4.9-2.2l-1-1.1c-.6-.6-.9-1.4-.9-2.2V7.5c0-2.4-1.9-4.3-4.3-4.3Z"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinejoin="round"
              />
              <path
                d="M9.6 18.3c.3 1.1 1.2 1.9 2.4 1.9s2.1-.8 2.4-1.9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
            </svg>
            {pending > 0 && (
              <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-[3px] text-[10px] leading-4 font-bold text-white bg-accent rounded-full text-center">
                {pending > 9 ? "9+" : pending}
              </span>
            )}
          </button>
          <span className="text-sm font-bold text-black/70 ml-1 truncate max-w-[96px] sm:max-w-none whitespace-nowrap">
            {adminLabel}
          </span>
        </header>
        <main className="flex-1 min-h-0 p-4 sm:p-6 overflow-y-auto overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
