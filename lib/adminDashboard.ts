// 관리자 대시보드(개요) 화면이 사용하는 집계 조회 전용 계층입니다.
// 전부 SELECT(count) 조회만 하고, 상태를 바꾸지 않습니다.
import { createClient } from "@/lib/supabase/client";

export interface DashboardStats {
  todayVisits: number;
  totalUsers: number;
  newUsersToday: number;
  totalQuestionnaires: number;
  newQuestionnairesToday: number;
  totalResponses: number;
  pendingInquiries: number;
  totalInquiries: number;
}

// ⚠️(2026-09 버그 수정): toISOString()은 항상 UTC 기준 날짜를 반환합니다. 한국
// (KST, UTC+9) 자정이 지나도 UTC로는 최대 9시간 동안 아직 전날이라, "오늘" 통계가
// 한국 자정에 맞춰 리셋되지 않는 것처럼 보였습니다(DB의 record_visit RPC도 같은
// 이유로 Asia/Seoul 기준으로 고쳤습니다 — supabase/schema.sql 참고). 브라우저의
// 로컬 타임존에 기대지 않고 항상 한국 시간 기준으로 명시적으로 날짜를 계산합니다.
function todayDateStr() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
}

function todayStartISO() {
  // 한국 자정(00:00 KST)을 UTC ISO 문자열로 변환합니다. created_at은 UTC로
  // 저장되므로, "오늘 자정 이후"를 판단하는 기준도 한국 자정이어야 합니다.
  return new Date(`${todayDateStr()}T00:00:00+09:00`).toISOString();
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const supabase = createClient();
  const todayStart = todayStartISO();
  const today = todayDateStr();

  const [
    visitsRes,
    usersRes,
    newUsersRes,
    questionnairesRes,
    newQuestionnairesRes,
    responsesRes,
    pendingInquiriesRes,
    totalInquiriesRes,
  ] = await Promise.all([
    supabase.from("daily_visits").select("count").eq("day", today).maybeSingle(),
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).gte("created_at", todayStart),
    supabase.from("questionnaires").select("*", { count: "exact", head: true }),
    supabase
      .from("questionnaires")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase.from("responses").select("*", { count: "exact", head: true }).eq("visibility", "active"),
    supabase.from("inquiries").select("*", { count: "exact", head: true }).is("admin_reply", null),
    supabase.from("inquiries").select("*", { count: "exact", head: true }),
  ]);

  return {
    todayVisits: visitsRes.data?.count ?? 0,
    totalUsers: usersRes.count ?? 0,
    newUsersToday: newUsersRes.count ?? 0,
    totalQuestionnaires: questionnairesRes.count ?? 0,
    newQuestionnairesToday: newQuestionnairesRes.count ?? 0,
    totalResponses: responsesRes.count ?? 0,
    pendingInquiries: pendingInquiriesRes.count ?? 0,
    totalInquiries: totalInquiriesRes.count ?? 0,
  };
}
