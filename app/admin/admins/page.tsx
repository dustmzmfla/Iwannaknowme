"use client";

import { useCallback, useEffect, useState } from "react";
import { listAdmins, addAdmin, removeAdmin } from "@/lib/mockDb";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { AdminAllowlistEntry } from "@/lib/types";

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminAllowlistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [kakaoId, setKakaoId] = useState("");
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<AdminAllowlistEntry | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setAdmins(await listAdmins());
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAdd() {
    if (!kakaoId.trim() || busy) return;
    setBusy(true);
    try {
      await addAdmin(kakaoId.trim(), label.trim());
      setKakaoId("");
      setLabel("");
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "관리자를 추가하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRemove() {
    if (!removeTarget) return;
    setBusy(true);
    try {
      await removeAdmin(removeTarget.kakaoId);
      setRemoveTarget(null);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "관리자를 삭제하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">관리자 계정 관리</h1>
      <p className="text-sm text-ink-soft mb-6 leading-relaxed">
        여기 등록된 카카오 계정으로 로그인하면 자동으로 관리자 권한이 부여되고,
        로그인 후 햄버거 메뉴에 &lsquo;관리자 페이지&rsquo; 버튼이 나타납니다. 아직
        한 번도 로그인하지 않은 카카오 계정도 미리 등록해둘 수 있어요 — 그 계정이
        나중에 처음 로그인하는 순간 바로 관리자가 됩니다. 카카오 아이디는 해당
        계정으로 한 번 로그인한 뒤 유저 상세 화면(또는 이 목록)에서 확인할 수
        있습니다.
      </p>

      <div className="bg-white rounded-2xl border border-black/10 p-5 mb-6">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={kakaoId}
            onChange={(e) => setKakaoId(e.target.value)}
            placeholder="카카오 아이디 (kakao_id)"
            className="flex-1 border border-black/15 rounded-xl px-3.5 py-2.5 text-sm"
          />
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="메모 (예: 대표 운영자) — 선택"
            className="flex-1 border border-black/15 rounded-xl px-3.5 py-2.5 text-sm"
          />
          <button
            onClick={handleAdd}
            disabled={busy || !kakaoId.trim()}
            className="px-4 py-2.5 rounded-xl bg-ink text-paper-card text-sm font-bold disabled:opacity-40 whitespace-nowrap"
          >
            관리자 추가
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/5 text-left text-ink-soft">
              <th className="px-4 py-3 font-medium">카카오 아이디</th>
              <th className="px-4 py-3 font-medium">메모</th>
              <th className="px-4 py-3 font-medium">등록일</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {admins.map((a) => (
              <tr key={a.kakaoId} className="border-t border-black/5">
                <td className="px-4 py-3 font-bold">{a.kakaoId}</td>
                <td className="px-4 py-3 text-ink-soft">{a.label ?? "—"}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {new Date(a.createdAt).toLocaleString("ko-KR")}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => setRemoveTarget(a)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-accent/40 text-accent"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {!loading && admins.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-ink-soft">
                  등록된 관리자가 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <ConfirmDialog
        open={!!removeTarget}
        title="관리자 권한을 삭제할까요?"
        description={`'${removeTarget?.label || removeTarget?.kakaoId}' 계정은 더 이상 관리자 페이지에 접근할 수 없게 됩니다.`}
        confirmLabel="삭제"
        danger
        onCancel={() => setRemoveTarget(null)}
        onConfirm={handleRemove}
      />
    </div>
  );
}
