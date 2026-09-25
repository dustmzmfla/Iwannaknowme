import { NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// Supabase 무료 플랜 프로젝트는 7일간 DB 활동(쿼리)이 없으면 자동으로
// 일시정지됩니다. 이 엔드포인트는 Vercel Cron(vercel.json 참고, 하루 1회)이
// 호출해서 아주 가벼운 읽기 전용 쿼리 하나를 날려주는 "핑" 역할만 합니다.
// - 읽기 전용(select)이라 DB 용량을 전혀 차지하지 않습니다.
// - categories 테이블은 6행짜리 고정 카테고리 목록이라 응답 크기가 거의 0이라
//   egress(대역폭) 사용량도 무시할 수 있는 수준입니다.
// - CRON_SECRET 환경변수를 설정해두면, Vercel이 자동으로 붙여주는
//   Authorization 헤더 값과 비교해서 외부에서 아무나 호출하지 못하게 막습니다.
//   (Vercel 프로젝트 설정 > Environment Variables에서 CRON_SECRET을 추가하세요.)
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
  }

  const supabase = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { error } = await supabase.from("categories").select("id").limit(1);
  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, pingedAt: new Date().toISOString() });
}
