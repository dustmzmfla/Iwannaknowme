// 관리자 페이지(+ 카테고리/질문 관리, 관리자 계정 관리)가 사용하는 데이터 계층입니다.
// 실제 Supabase(Postgres) 테이블을 조회/변경합니다.
//
// 보안 설계:
// - 조회(SELECT)는 브라우저의 Supabase 클라이언트로 직접 실행되지만, RLS 정책이
//   "본인 또는 관리자만" 보이도록 DB 레벨에서 강제합니다 (supabase/schema.sql 참고).
// - 상태를 바꾸는 모든 동작은 전부 SECURITY DEFINER RPC 함수를 통해서만 실행되며,
//   그 함수들이 내부에서 "호출자가 실제로 admin role인지"를 다시 한번 검증합니다.

import { createClient } from "@/lib/supabase/client";
import type {
  AdminAllowlistEntry,
  AdminAuditLog,
  AppUser,
  QuestionBankItem,
  QuestionCategory,
  Questionnaire,
  QuestionResponse,
} from "./types";

function rowToUser(row: any): AppUser {
  return {
    id: row.id,
    kakaoId: row.kakao_id,
    name: row.name,
    avatarUrl: row.avatar_url,
    birthDate: row.birth_date,
    createdAt: row.created_at,
    consent: {
      termsAgreedAt: row.terms_agreed_at,
      privacyRequiredAgreedAt: row.privacy_required_agreed_at,
      privacyOptionalAgreedAt: row.privacy_optional_agreed_at,
    },
    status: row.status,
    role: row.role,
  };
}

function rowToQuestionnaire(row: any): Questionnaire {
  return {
    id: row.id,
    ownerId: row.owner_id,
    questions: row.questions,
    relationRequired: true,
    finalMessageRequired: true,
    createdAt: row.created_at,
  };
}

function rowToResponse(row: any): QuestionResponse {
  return {
    id: row.id,
    questionnaireId: row.questionnaire_id,
    nickname: row.nickname,
    isAnonymous: row.is_anonymous,
    relationDuration: row.relation_duration,
    relationCloseness: row.relation_closeness,
    finalMessage: row.final_message,
    answers: row.answers ?? {},
    visibility: row.visibility,
    isRead: !!row.is_read,
    createdAt: row.created_at,
    moderatedAt: row.moderated_at,
  };
}

// ---------------- 유저 조회 ----------------

export async function listUsers(params: {
  search?: string;
  page: number;
  pageSize: number;
}): Promise<{ users: AppUser[]; total: number }> {
  const supabase = createClient();
  const q = (params.search ?? "").trim();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`name.ilike.%${q}%,kakao_id.ilike.%${q}%`);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;
  return { users: (data ?? []).map(rowToUser), total: count ?? 0 };
}

export async function getUserStats(): Promise<{ total: number; admins: number; suspended: number }> {
  const supabase = createClient();
  const [totalRes, adminsRes, suspendedRes] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "admin"),
    supabase.from("profiles").select("*", { count: "exact", head: true }).eq("status", "suspended"),
  ]);
  return {
    total: totalRes.count ?? 0,
    admins: adminsRes.count ?? 0,
    suspended: suspendedRes.count ?? 0,
  };
}

export async function getUser(userId: string): Promise<AppUser | undefined> {
  const supabase = createClient();
  const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
  return data ? rowToUser(data) : undefined;
}

export async function getRecentUsers(limit = 5): Promise<AppUser[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToUser);
}

export async function getQuestionnaireByOwner(ownerId: string): Promise<Questionnaire | undefined> {
  const supabase = createClient();
  const { data } = await supabase
    .from("questionnaires")
    .select("*")
    .eq("owner_id", ownerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ? rowToQuestionnaire(data) : undefined;
}

export async function listResponses(questionnaireId: string): Promise<QuestionResponse[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("responses")
    .select("*")
    .eq("questionnaire_id", questionnaireId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToResponse);
}

export async function listAuditLog(targetId?: string): Promise<AdminAuditLog[]> {
  const supabase = createClient();
  let query = supabase.from("admin_audit_log").select("*").order("created_at", { ascending: false });
  if (targetId) query = query.eq("target_id", targetId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    actorId: row.actor_id ?? "system",
    actorLabel: row.actor_label,
    action: row.action,
    targetType: row.target_type,
    targetId: row.target_id,
    createdAt: row.created_at,
    note: row.note ?? undefined,
  }));
}

// ---------------- 관리자 액션 (전부 RPC — auth.uid()로 호출자를 서버에서 직접 확인) ----------------

export async function hideResponseAsUser(responseId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("user_hide_own_response", { p_response_id: responseId });
  if (error) throw error;
}

export async function hideResponseAsAdmin(responseId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_hide_response", { p_response_id: responseId });
  if (error) throw error;
}

export async function restoreResponse(responseId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_restore_response", { p_response_id: responseId });
  if (error) throw error;
}

export async function purgeResponse(responseId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_purge_response", { p_response_id: responseId });
  if (error) throw error;
}

export async function setUserSuspended(userId: string, suspended: boolean) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_set_user_status", {
    p_user_id: userId,
    p_suspended: suspended,
  });
  if (error) throw error;
}

// ---------------- 카테고리 / 질문 은행 관리 ----------------

export async function listCategories(): Promise<QuestionCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    name: row.name,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  }));
}

export async function listQuestionBank(categoryId?: string): Promise<QuestionBankItem[]> {
  const supabase = createClient();
  let query = supabase.from("question_bank").select("*").order("sort_order");
  if (categoryId) query = query.eq("category_id", categoryId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    id: row.id,
    categoryId: row.category_id,
    text: row.text,
    sortOrder: row.sort_order,
    isActive: row.is_active,
    createdAt: row.created_at,
  }));
}

export async function addCategory(name: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_add_category", { p_name: name });
  if (error) throw error;
  return data as string;
}

export async function deleteCategory(categoryId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_delete_category", { p_category_id: categoryId });
  if (error) throw error;
}

export async function addQuestion(categoryId: string, text: string): Promise<string> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("admin_add_question", {
    p_category_id: categoryId,
    p_text: text,
  });
  if (error) throw error;
  return data as string;
}

export async function updateQuestion(questionId: string, text: string, isActive: boolean) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_update_question", {
    p_question_id: questionId,
    p_text: text,
    p_is_active: isActive,
  });
  if (error) throw error;
}

export async function deleteQuestion(questionId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_delete_question", { p_question_id: questionId });
  if (error) throw error;
}

// ---------------- 관리자 계정 관리 ----------------

export async function listAdmins(): Promise<AdminAllowlistEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("admin_allowlist")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map((row: any) => ({
    kakaoId: row.kakao_id,
    label: row.label,
    addedBy: row.added_by,
    createdAt: row.created_at,
  }));
}

export async function addAdmin(kakaoId: string, label: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_add_admin", {
    p_kakao_id: kakaoId.trim(),
    p_label: label.trim() || null,
  });
  if (error) throw error;
}

export async function removeAdmin(kakaoId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_remove_admin", { p_kakao_id: kakaoId });
  if (error) throw error;
}
