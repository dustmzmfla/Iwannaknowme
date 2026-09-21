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

export default function AdminUsersPage() {
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
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold">유저 관리</h1>
          <p className="text-xs text-black/50 mt-0.5">
            전체 {stats.total}명 · 관리자 {stats.admins}명 · 정지 {stats.suspended}명
          </p>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="이름 · 카카오 아이디로 검색"
          className="border border-black/15 rounded-md px-3 py-2 text-sm bg-white w-64"
        />
      </div>

      <div className="bg-white border border-black/10 rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/[0.03] text-left text-xs text-black/50">
              <th className="px-4 py-2.5 font-medium">이름</th>
              <th className="px-4 py-2.5 font-medium">카카오 아이디</th>
              <th className="px-4 py-2.5 font-medium">생년월일</th>
              <th className="px-4 py-2.5 font-medium">가입일</th>
              <th className="px-4 py-2.5 font-medium">상태</th>
              <th className="px-4 py-2.5 font-medium">권한</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {result.users.map((u) => (
              <tr key={u.id} className="hover:bg-black/[0.015]">
                <td className="px-4 py-2.5">
                  <Link href={`/admin/users/${u.id}`} className="font-bold text-accent hover:underline">
                    {u.name}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-black/60">{u.kakaoId}</td>
                <td className="px-4 py-2.5 text-black/60">{maskBirthDate(u.birthDate)}</td>
                <td className="px-4 py-2.5 text-black/60">
                  {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-2.5">
                  {u.status === "suspended" ? (
                    <span className="text-xs font-bold text-accent">정지됨</span>
                  ) : (
                    <span className="text-xs font-bold text-green-700">활성</span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <button
                    onClick={() => setAdminToggleTarget(u)}
                    className={
                      u.role === "admin"
                        ? "text-xs font-bold text-white bg-ink px-2.5 py-1 rounded hover:opacity-80"
                        : "text-xs text-black/50 border border-black/15 px-2.5 py-1 rounded hover:bg-black/5"
                    }
                  >
                    {u.role === "admin" ? "관리자" : "일반"}
                  </button>
                </td>
              </tr>
            ))}
            {!loading && result.users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-black/40">
                  검색 결과가 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={result.total} onChange={setPage} />

      <p className="text-xs text-black/40 mt-4">
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
