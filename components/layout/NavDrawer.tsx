"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { AppUser } from "@/lib/types";

export function NavDrawer({
  open,
  onClose,
  profile,
  isAdmin,
}: {
  open: boolean;
  onClose: () => void;
  profile: AppUser;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const { signOut } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function go(href: string) {
    onClose();
    router.push(href);
  }

  async function handleLogout() {
    await signOut();
    onClose();
    router.push("/");
    router.refresh();
  }

  async function handleDeleteAccount() {
    if (deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/account/delete", { method: "POST" });
      if (!res.ok) throw new Error("delete failed");
      setConfirmDelete(false);
      onClose();
      router.push("/");
      router.refresh();
    } catch {
      alert("계정을 삭제하지 못했어요. 잠시 후 다시 시도해줘.");
      setDeleting(false);
    }
  }

  return (
    <>
      {/* 어두운 배경 오버레이 — 클릭하면 드로어가 닫힙니다 */}
      <div
        aria-hidden
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/55 transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* 오른쪽에서 튀어나오는 네비게이션 (뷰포트 폭의 50%) */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="메뉴"
        className={`fixed top-0 right-0 z-50 h-full w-1/2 min-w-[240px] max-w-[380px] bg-paper-card shadow-2xl flex flex-col px-5 py-6 transition-transform duration-300 ease-out will-change-transform ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <button
          onClick={onClose}
          aria-label="메뉴 닫기"
          className="self-end w-9 h-9 rounded-full border-2 border-transparent bg-white flex items-center justify-center mb-4 active:scale-95 active:border-accent focus-visible:border-accent transition"
        >
          ✕
        </button>

        <div className="flex items-center gap-3 mb-6 pb-5 border-b border-black/10 min-w-0">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={profile.avatarUrl}
              alt=""
              className="w-12 h-12 rounded-full object-cover border border-black/10 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-highlight/60 flex items-center justify-center font-display text-lg shrink-0">
              {profile.name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0">
            <p className="font-display text-lg leading-tight truncate">{profile.name}</p>
            <p className="text-xs text-ink-soft flex items-center gap-1.5">
              카카오로 로그인함
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  profile.membershipTier === "admin"
                    ? "bg-ink text-paper-card"
                    : profile.membershipTier === "paid"
                      ? "bg-highlight/70 text-ink"
                      : "bg-black/5 text-ink-soft"
                }`}
              >
                {profile.membershipTier === "admin"
                  ? "관리자"
                  : profile.membershipTier === "paid"
                    ? "유료회원 ✨"
                    : "일반회원"}
              </span>
            </p>
          </div>
        </div>

        <nav className="flex flex-col gap-1.5">
          <button
            onClick={() => go("/build")}
            className="text-left font-bold text-[14.5px] py-3 px-3 rounded-xl hover:bg-black/5 active:bg-black/10 transition"
          >
            ✏️ 새 질문 만들기
          </button>
          <button
            onClick={() => go("/my/responses")}
            className="text-left font-bold text-[14.5px] py-3 px-3 rounded-xl hover:bg-black/5 active:bg-black/10 transition"
          >
            💌 받은 답변 보기
          </button>
          <button
            onClick={() => go("/inquiries")}
            className="text-left font-bold text-[14.5px] py-3 px-3 rounded-xl hover:bg-black/5 active:bg-black/10 transition"
          >
            📮 문의하기
          </button>
          <button
            onClick={() => go("/code")}
            className="text-left font-bold text-[14.5px] py-3 px-3 rounded-xl hover:bg-black/5 active:bg-black/10 transition"
          >
            🎟 코드입력
          </button>
          {isAdmin && (
            <button
              onClick={() => go("/manage-x7k29q")}
              className="text-left font-bold text-[14.5px] py-3 px-3 rounded-xl bg-ink text-paper-card hover:opacity-90 transition mt-1"
            >
              🛠 관리자 페이지
            </button>
          )}
        </nav>

        <div className="mt-auto pt-5 border-t border-black/10 flex flex-col gap-1">
          <button
            onClick={handleLogout}
            className="text-left text-[13px] font-bold text-ink-soft py-2.5 px-3 rounded-xl hover:bg-black/5 transition"
          >
            로그아웃
          </button>
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-left text-[13px] font-bold text-accent py-2.5 px-3 rounded-xl hover:bg-accent/10 transition"
          >
            🗑 계정 삭제
          </button>
        </div>
      </aside>

      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-6">
          <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl">
            <h3 className="font-bold text-lg mb-2 text-accent">정말 계정을 삭제할까요?</h3>
            <p className="text-sm text-ink-soft mb-4 leading-relaxed">
              계정을 삭제하면 만든 질문지와 받은 답변을 포함한 모든 정보가 영구히
              삭제되고, 되돌릴 수 없어요.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm font-bold"
              >
                취소
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white bg-accent disabled:opacity-50"
              >
                {deleting ? "삭제 중..." : "삭제하기"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
