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

function todayStartISO() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  return start.toISOString();
}

function todayDateStr() {
  return new Date().toISOString().slice(0, 10);
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
