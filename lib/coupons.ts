// 프로모션 코드(쿠폰) — 유저의 "코드입력" 등록과 관리자의 쿠폰 생성/조회/삭제를 담당합니다.
// 실제 검증(코드 존재 여부, 일회성/다회성 사용 가능 여부, 중복 사용 방지)은 전부
// redeem_coupon RPC(SECURITY DEFINER)가 서버에서 수행합니다 — 클라이언트는 결과만 받습니다.
import { createClient } from "@/lib/supabase/client";
import type { Coupon, CouponKind, CouponRedemption, CouponType, CouponWithUsage } from "./types";

const CODE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

/** 랜덤 코드 생성 (기본 10자 — 최대 15자 제한 안에서 충분히 짧고 입력하기 쉬운 길이). */
export function generateCouponCode(length = 10): string {
  let out = "";
  if (typeof crypto !== "undefined" && crypto.getRandomValues) {
    const buf = new Uint32Array(length);
    crypto.getRandomValues(buf);
    for (let i = 0; i < length; i++) out += CODE_CHARS[buf[i] % CODE_CHARS.length];
  } else {
    for (let i = 0; i < length; i++) out += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return out;
}

/** 코드 형식 검증 — 영문+숫자, 대소문자 구분, 1~15자. */
export function isValidCouponCode(code: string): boolean {
  return /^[A-Za-z0-9]{1,15}$/.test(code);
}

function rowToCoupon(row: any): Coupon {
  return {
    id: row.id,
    code: row.code,
    type: row.type,
    kind: row.kind,
    discountRate: row.discount_rate,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// ---------------- 유저 — 코드입력 ----------------

export interface RedeemResult {
  kind: CouponKind;
  discountRate: number | null;
}

/** "코드입력" 화면에서 호출합니다. 실패 시 error.message가 사용자에게 보여줄 만한 문구입니다.
 * 성공하면 어떤 종류의 코드였는지 돌려줘서, 구독권/할인권에 맞는 안내 메시지를 보여줄 수 있어요. */
export async function redeemCode(code: string): Promise<RedeemResult> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("redeem_coupon", { p_code: code });
  if (error) throw error;
  return { kind: data.kind, discountRate: data.discountRate };
}

// ---------------- 관리자 — 쿠폰 관리 ----------------

export async function listCoupons(params: {
  page: number;
  pageSize: number;
}): Promise<{ items: CouponWithUsage[]; total: number }> {
  const supabase = createClient();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  const { data, count, error } = await supabase
    .from("coupons")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);
  if (error) throw error;

  const coupons = (data ?? []).map(rowToCoupon);
  if (coupons.length === 0) return { items: [], total: count ?? 0 };

  // 이 페이지에 보이는 쿠폰들의 사용 횟수만 별도로 세어서 합칩니다.
  const ids = coupons.map((c) => c.id);
  const { data: redemptionRows, error: redemptionError } = await supabase
    .from("coupon_redemptions")
    .select("coupon_id")
    .in("coupon_id", ids);
  if (redemptionError) throw redemptionError;

  const counts = new Map<string, number>();
  for (const row of redemptionRows ?? []) {
    counts.set(row.coupon_id, (counts.get(row.coupon_id) ?? 0) + 1);
  }

  return {
    items: coupons.map((c) => ({ ...c, usedCount: counts.get(c.id) ?? 0 })),
    total: count ?? 0,
  };
}

/** 쿠폰 하나를 누가, 언제 사용했는지 — "보기" 팝업에서 씁니다. */
export async function getCouponRedemptions(couponId: string): Promise<CouponRedemption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("coupon_redemptions")
    .select("user_id, redeemed_at, profiles(name)")
    .eq("coupon_id", couponId)
    .order("redeemed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    userId: row.user_id,
    userName: row.profiles?.name ?? "탈퇴한 유저",
    redeemedAt: row.redeemed_at,
  }));
}

export async function createCoupon(
  code: string,
  type: CouponType,
  kind: CouponKind,
  discountRate: number | null
): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_create_coupon", {
    p_code: code,
    p_type: type,
    p_kind: kind,
    p_discount_rate: discountRate,
  });
  if (error) throw error;
  return data as string;
}

export async function deleteCoupon(couponId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_delete_coupon", { p_coupon_id: couponId });
  if (error) throw error;
}
