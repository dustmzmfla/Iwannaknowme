"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Pagination } from "@/components/admin/Pagination";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import {
  createCoupon,
  deleteCoupon,
  generateCouponCode,
  getCouponRedemptions,
  isValidCouponCode,
  listCoupons,
} from "@/lib/coupons";
import type { CouponKind, CouponRedemption, CouponType, CouponWithUsage } from "@/lib/types";

function kindLabel(c: CouponWithUsage) {
  return c.kind === "subscription" ? "구독권" : `할인권 ${c.discountRate}%`;
}

const PAGE_SIZE = 20;

function usageBadge(c: CouponWithUsage) {
  if (c.usedCount === 0) {
    return <span className="text-xs font-bold text-black/40 bg-black/5 rounded-full px-2 py-0.5">미사용</span>;
  }
  if (c.type === "single") {
    return (
      <span className="text-xs font-bold text-green-700 bg-green-700/10 rounded-full px-2 py-0.5">사용완료</span>
    );
  }
  return (
    <span className="text-xs font-bold text-green-700 bg-green-700/10 rounded-full px-2 py-0.5">
      {c.usedCount}명 사용
    </span>
  );
}

export default function AdminCouponsPage() {
  const router = useRouter();

  // 생성 폼
  const [kind, setKind] = useState<CouponKind>("discount");
  const [discountRate, setDiscountRate] = useState("");
  const [type, setType] = useState<CouponType>("single");
  const [code, setCode] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // 목록
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<{ items: CouponWithUsage[]; total: number }>({
    items: [],
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  // 삭제
  const [deleteTarget, setDeleteTarget] = useState<CouponWithUsage | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  // "보기" 팝업
  const [viewTarget, setViewTarget] = useState<CouponWithUsage | null>(null);
  const [redemptions, setRedemptions] = useState<CouponRedemption[]>([]);
  const [redemptionsLoading, setRedemptionsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listCoupons({ page, pageSize: PAGE_SIZE })
      .then((r) => {
        if (!cancelled) setResult(r);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, refreshKey]);

  async function handleCreate() {
    const trimmed = code.trim();
    if (!trimmed) {
      setCreateError("코드를 입력하거나 랜덤 생성 버튼을 눌러줘.");
      return;
    }
    if (!isValidCouponCode(trimmed)) {
      setCreateError("코드는 영문+숫자 조합으로 15자 이하여야 해요.");
      return;
    }
    let rate: number | null = null;
    if (kind === "discount") {
      rate = Number(discountRate);
      if (!discountRate.trim() || !Number.isInteger(rate) || rate < 1 || rate > 99) {
        setCreateError("할인율은 1~99 사이의 숫자로 입력해줘.");
        return;
      }
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createCoupon(trimmed, type, kind, rate);
      setCode("");
      setDiscountRate("");
      setPage(1);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      setCreateError(e?.message ?? "쿠폰을 생성하지 못했어요.");
    } finally {
      setCreating(false);
    }
  }

  async function openView(c: CouponWithUsage) {
    setViewTarget(c);
    setRedemptions([]);
    setRedemptionsLoading(true);
    try {
      const rows = await getCouponRedemptions(c.id);
      setRedemptions(rows);
    } finally {
      setRedemptionsLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleteBusy) return;
    setDeleteBusy(true);
    try {
      await deleteCoupon(deleteTarget.id);
      setDeleteTarget(null);
      setRefreshKey((k) => k + 1);
    } catch (e: any) {
      alert(e?.message ?? "쿠폰을 삭제하지 못했어요.");
    } finally {
      setDeleteBusy(false);
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-lg font-bold mb-4">쿠폰 관리</h1>

      {/* 생성 폼 */}
      <div className="bg-white rounded-2xl border border-black/10 p-5 mb-6">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mb-3">
          <label className="flex items-center gap-1.5 text-sm font-bold cursor-pointer select-none">
            <input
              type="radio"
              name="coupon-kind"
              checked={kind === "discount"}
              onChange={() => setKind("discount")}
              className="accent-accent w-4 h-4"
            />
            할인권
          </label>
          <label className="flex items-center gap-1.5 text-sm font-bold cursor-pointer select-none">
            <input
              type="radio"
              name="coupon-kind"
              checked={kind === "subscription"}
              onChange={() => setKind("subscription")}
              className="accent-accent w-4 h-4"
            />
            구독권 (등록 시 유료회원으로 업그레이드)
          </label>
        </div>

        {kind === "discount" && (
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm">
              <span className="font-bold shrink-0">할인율</span>
              <input
                type="number"
                min={1}
                max={99}
                value={discountRate}
                onChange={(e) => {
                  setDiscountRate(e.target.value);
                  if (createError) setCreateError(null);
                }}
                placeholder="예: 20"
                className="w-24 border border-black/15 rounded-xl px-3 py-1.5 text-sm"
              />
              <span className="text-ink-soft">%</span>
            </label>
          </div>
        )}

        <div className="flex items-center gap-5 mb-3">
          <label className="flex items-center gap-1.5 text-sm font-bold cursor-pointer select-none">
            <input
              type="radio"
              name="coupon-type"
              checked={type === "single"}
              onChange={() => setType("single")}
              className="accent-accent w-4 h-4"
            />
            일회성
          </label>
          <label className="flex items-center gap-1.5 text-sm font-bold cursor-pointer select-none">
            <input
              type="radio"
              name="coupon-type"
              checked={type === "multi"}
              onChange={() => setType("multi")}
              className="accent-accent w-4 h-4"
            />
            다회성
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              if (createError) setCreateError(null);
            }}
            placeholder="코드 직접 입력 (영문+숫자, 최대 15자)"
            maxLength={15}
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            className="flex-1 min-w-0 border border-black/15 rounded-xl px-3.5 py-2.5 text-sm"
          />
          <button
            type="button"
            onClick={() => setCode(generateCouponCode())}
            className="flex-none px-3.5 py-2.5 rounded-xl bg-white border border-black/15 text-sm font-bold hover:bg-black/5"
          >
            랜덤 생성
          </button>
          <button
            type="button"
            onClick={handleCreate}
            disabled={creating}
            className="flex-none px-4 py-2.5 rounded-xl bg-ink text-paper-card text-sm font-bold disabled:opacity-40"
          >
            {creating ? "생성 중..." : "쿠폰 생성"}
          </button>
        </div>
        {createError && <p className="text-xs text-accent font-bold mt-2">{createError}</p>}
        <p className="text-[11px] text-black/40 mt-2">
          * 코드는 영문+숫자이며 대소문자 구분이 있습니다. 최대 15자, 그 이하도 가능해요.
        </p>
      </div>

      {/* 목록 */}
      <div className="bg-white border border-black/10 rounded-md overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="bg-black/[0.03] text-left text-xs text-black/50">
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">생성일</th>
              <th className="px-4 py-2.5 font-medium">쿠폰명</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">종류</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">타입</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">사용유무</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap">사용자</th>
              <th className="px-4 py-2.5 font-medium whitespace-nowrap"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {result.items.map((c) => (
              <tr key={c.id} className="hover:bg-black/[0.015]">
                <td className="px-4 py-2.5 text-black/60 whitespace-nowrap">
                  {new Date(c.createdAt).toLocaleDateString("ko-KR")}
                </td>
                <td className="px-4 py-2.5 font-bold font-mono whitespace-nowrap">{c.code}</td>
                <td className="px-4 py-2.5 text-black/60 whitespace-nowrap">{kindLabel(c)}</td>
                <td className="px-4 py-2.5 text-black/60 whitespace-nowrap">
                  {c.type === "single" ? "일회성" : "다회성"}
                </td>
                <td className="px-4 py-2.5 whitespace-nowrap">{usageBadge(c)}</td>
                <td className="px-4 py-2.5 whitespace-nowrap">
                  {c.usedCount > 0 ? (
                    <button
                      onClick={() => openView(c)}
                      className="text-xs font-bold text-accent border border-accent/40 px-2.5 py-1 rounded-lg hover:bg-accent/10"
                    >
                      보기
                    </button>
                  ) : (
                    <span className="text-black/30">—</span>
                  )}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap">
                  <button
                    onClick={() => setDeleteTarget(c)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg border border-accent/40 text-accent hover:bg-accent/10"
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
            {!loading && result.items.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-black/40">
                  생성된 쿠폰이 없어요.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={result.total} onChange={setPage} />

      {/* 사용 내역 팝업 */}
      {viewTarget && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
          onClick={() => setViewTarget(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-bold text-lg mb-1">
              <span className="font-mono">{viewTarget.code}</span> 사용 내역
            </h3>
            <p className="text-xs text-ink-soft mb-1">{kindLabel(viewTarget)}</p>
            <p className="text-xs text-black/40 mb-3">
              유저를 누르면 해당 유저 프로필로 이동해요.
            </p>

            <div className="flex-1 overflow-y-auto -mx-1 px-1">
              {redemptionsLoading ? (
                <p className="text-sm text-black/40 py-6 text-center">불러오는 중...</p>
              ) : redemptions.length === 0 ? (
                <p className="text-sm text-black/40 py-6 text-center">사용 내역이 없어요.</p>
              ) : (
                <ul className="divide-y divide-black/5">
                  {redemptions.map((r) => (
                    <li key={r.userId + r.redeemedAt}>
                      <button
                        onClick={() => {
                          setViewTarget(null);
                          router.push(`/manage-x7k29q/users/${r.userId}`);
                        }}
                        className="w-full flex items-center justify-between gap-3 py-2.5 text-sm hover:bg-black/[0.03] rounded-lg px-2 -mx-2"
                      >
                        <span className="font-bold text-accent truncate">{r.userName}</span>
                        <span className="shrink-0 text-xs text-black/40 whitespace-nowrap">
                          {new Date(r.redeemedAt).toLocaleString("ko-KR")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              onClick={() => setViewTarget(null)}
              className="mt-4 w-full py-2.5 rounded-xl border border-black/10 text-sm font-bold"
            >
              닫기
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="쿠폰을 삭제할까요?"
        description={`'${deleteTarget?.code}' 코드를 삭제하면 사용 기록도 함께 지워지고, 되돌릴 수 없어요.`}
        confirmLabel="삭제"
        danger
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
