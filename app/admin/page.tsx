"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listUsers, getUserStats, addAdmin, removeAdmin } from "@/lib/mockDb";
import { Pagination } from "@/components/admin/Pagination";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { AppUser } from "@/lib/types";

const PAGE_SIZE = 30;

function maskBirthDate(birth: string | null) {
  if (!birth) return "미동의";
  return `${birth.slice(0, 4)}-**-**`;
}

export default function AdminUserListPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ users: AppUser[]; total: number }>({
    users: [],
    total: 0,
  });
  const [stats, setStats] = useState({ total: 0, admins: 0, suspended: 0 });
  const [loading, setLoading] = useState(true);
  const [adminToggleTarget, setAdminToggleTarget] = useState<AppUser | null>(null);
  const [adminBusy, setAdminBusy] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listUsers({ search, page, pageSize: PAGE_SIZE })
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, page, refreshKey]);

  useEffect(() => {
    getUserStats().then(setStats);
  }, [refreshKey]);

  return (
    <div>
      {/* 벤또 그리드 요약 영역 */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <div className="col-span-4 sm:col-span-2 sm:row-span-2 rounded-[22px] bg-ink text-paper-card p-6 flex flex-col justify-center">
          <h1 className="text-2xl font-bold mb-1.5">유저 관리</h1>
          <p className="text-sm text-paper-card/70 leading-relaxed">
            카카오로 가입한 전체 유저를 확인하고, 카드를 눌러 관리자 권한을 지정할 수 있어요.
          </p>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-[20px] bg-highlight/60 p-4 flex flex-col justify-between min-h-[92px]">
          <span className="text-xs font-bold text-ink/70">전체 유저</span>
          <span className="text-3xl font-bold">{stats.total}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-[20px] bg-accent/15 p-4 flex flex-col justify-between min-h-[92px]">
          <span className="text-xs font-bold text-accent">관리자</span>
          <span className="text-3xl font-bold text-accent">{stats.admins}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-[20px] bg-white border border-black/10 p-4 flex flex-col justify-between min-h-[92px]">
          <span className="text-xs font-bold text-ink-soft">정지된 계정</span>
          <span className="text-3xl font-bold">{stats.suspended}</span>
        </div>

        <div className="col-span-2 sm:col-span-1 rounded-[20px] bg-white border border-black/10 p-4 flex flex-col justify-center gap-1.5 min-h-[92px]">
          <span className="text-xs font-bold text-ink-soft">검색</span>
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="이름 · 카카오 아이디"
            className="bg-transparent text-sm font-bold outline-none placeholder:text-ink-soft/50 placeholder:font-normal"
          />
        </div>
      </div>

      {/* 유저 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {result.users.map((u) => (
          <div key={u.id} className="bg-white rounded-[20px] border border-black/10 p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <Link href={`/admin/users/${u.id}`} className="font-bold text-accent hover:underline truncate">
                {u.name}
              </Link>
              <button
                onClick={() => setAdminToggleTarget(u)}
                title={u.role === "admin" ? "관리자 해제" : "관리자로 지정"}
                className={
                  u.role === "admin"
                    ? "shrink-0 text-xs font-bold text-white bg-ink px-2 py-1 rounded-full hover:opacity-80"
                    : "shrink-0 text-xs text-ink-soft border border-black/15 px-2 py-1 rounded-full hover:bg-black/5"
                }
              >
                {u.role === "admin" ? "관리자" : "일반"}
              </button>
            </div>

            <p className="text-xs text-ink-soft mb-0.5">카카오 아이디 {u.kakaoId}</p>
            <p className="text-xs text-ink-soft mb-3">생년월일 {maskBirthDate(u.birthDate)}</p>

            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-soft">
                {new Date(u.createdAt).toLocaleDateString("ko-KR")}
              </span>
              {u.status === "suspended" ? (
                <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-1 rounded-full">
                  정지됨
                </span>
              ) : (
                <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
                  활성
                </span>
              )}
            </div>
          </div>
        ))}

        {!loading && result.users.length === 0 && (
          <div className="col-span-full bg-white rounded-[20px] border border-black/10 px-4 py-10 text-center text-ink-soft">
            검색 결과가 없어요.
          </div>
        )}
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={result.total} onChange={setPage} />

      <p className="text-xs text-ink-soft mt-6">
        생년월일은 선택 동의 항목이라 목록에서는 연도만 노출하고 있어요. 전체 값은
        유저 상세 화면에서 확인할 수 있습니다.
      </p>

      <ConfirmDialog
        open={!!adminToggleTarget}
        title={
          adminToggleTarget?.role === "admin"
            ? "관리자 권한을 해제할까요?"
            : "관리자로 지정할까요?"
        }
        description={
          adminToggleTarget?.role === "admin"
            ? `'${adminToggleTarget?.name}' 계정은 더 이상 관리자 페이지에 접근할 수 없게 됩니다.`
            : `'${adminToggleTarget?.name}' 계정으로 로그인하면 바로 관리자 페이지에 접근할 수 있게 됩니다.`
        }
        confirmLabel={adminToggleTarget?.role === "admin" ? "관리자 해제" : "관리자로 지정"}
        danger={adminToggleTarget?.role === "admin"}
        onCancel={() => setAdminToggleTarget(null)}
        onConfirm={async () => {
          if (!adminToggleTarget || adminBusy) return;
          setAdminBusy(true);
          try {
            if (adminToggleTarget.role === "admin") {
              await removeAdmin(adminToggleTarget.kakaoId);
            } else {
              await addAdmin(adminToggleTarget.kakaoId, adminToggleTarget.name);
            }
            setAdminToggleTarget(null);
            setRefreshKey((k) => k + 1);
          } catch (e: any) {
            alert(e?.message ?? "관리자 권한을 변경하지 못했어요.");
          } finally {
            setAdminBusy(false);
          }
        }}
      />
    </div>
  );
}
