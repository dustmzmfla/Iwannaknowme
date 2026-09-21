// "질문지 만들기 → 공유 → 답변받기" 실사용 흐름을 위한 저장 계층입니다.
// 실제 Supabase questionnaires/responses 테이블을 사용합니다 — 다른 사람이 링크를
// 열어도 정상적으로 같은 질문지를 볼 수 있습니다.
import { createClient } from "@/lib/supabase/client";
import type { QuestionResponse } from "./types";

export interface PublishedQuestionnaire {
  id: string;
  creatorName: string;
  questions: string[];
  createdAt: string;
}

export interface SubmittedResponse {
  nickname: string | null;
  isAnonymous: boolean;
  duration: string;
  relation: "악연" | "지인" | "친구" | "절친" | "인연";
  finalMessage: string;
  answers: Record<number, string>;
  createdAt: string;
}

/** 로그인한 본인 이름으로 새 질문지를 발행합니다. 로그인이 안 되어 있으면 에러를 던집니다. */
export async function publishQuestionnaire(creatorName: string, questions: string[]): Promise<string> {
  const supabase = createClient();
  // ⚠️(2026-09 성능 최적화): getUser()는 호출할 때마다 Supabase 서버에 네트워크로
  // 재검증을 요청합니다. 이 화면은 이미 미들웨어가 로그인을 확인한 뒤에만 들어올 수
  // 있어서, 여기서는 로컬 세션을 바로 읽는 getSession()으로 충분합니다 (실제 권한은
  // 어차피 서버의 RLS가 다시 검증합니다).
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) throw new Error("로그인이 필요합니다");

  const { data, error } = await supabase
    .from("questionnaires")
    .insert({ owner_id: user.id, creator_name: creatorName, questions })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function getQuestionnaire(id: string): Promise<PublishedQuestionnaire | null> {
  const supabase = createClient();
  // ⚠️(2026-09): 질문자가 삭제한(visibility = 'hidden_by_user') 질문지는 답변자/공유
  // 화면에서는 "없는 질문지"처럼 취급합니다 (관리자 페이지에서는 계속 조회/복구 가능).
  const { data } = await supabase
    .from("questionnaires")
    .select("id, creator_name, questions, created_at")
    .eq("id", id)
    .eq("visibility", "active")
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id,
    creatorName: data.creator_name,
    questions: data.questions as string[],
    createdAt: data.created_at,
  };
}

export async function submitResponse(id: string, response: SubmittedResponse) {
  const supabase = createClient();
  const { error } = await supabase.from("responses").insert({
    questionnaire_id: id,
    nickname: response.nickname,
    is_anonymous: response.isAnonymous,
    relation_duration: response.duration,
    relation_closeness: response.relation,
    final_message: response.finalMessage,
    answers: response.answers,
  });
  if (error) throw error;
}

/** 공유 페이지의 "지금까지 N명이 답변했어요" 카운트용. 본인 질문지가 아니면
 * RLS가 막아서 조용히 0을 반환합니다 (에러로 화면을 깨뜨리지 않기 위함). */
export async function listResponses(id: string): Promise<SubmittedResponse[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("responses")
    .select("nickname, is_anonymous, relation_duration, relation_closeness, final_message, answers, created_at")
    .eq("questionnaire_id", id);
  if (error) return [];
  return (data ?? []).map((row: any) => ({
    nickname: row.nickname,
    isAnonymous: row.is_anonymous,
    duration: row.relation_duration,
    relation: row.relation_closeness,
    finalMessage: row.final_message,
    answers: row.answers ?? {},
    createdAt: row.created_at,
  }));
}

// ---------------- "받은 답변 보기" (질문 목록 → 응답자 목록 → 답변 상세) ----------------

export interface MyQuestionnaireSummary {
  id: string;
  questions: string[];
  createdAt: string;
  responseCount: number;
  unreadCount: number;
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

/** 홈 화면에서 "답변보기" 버튼을 보여줄지 결정하기 위한 가벼운 존재 확인. */
export async function hasAnyQuestionnaire(): Promise<boolean> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return false;
  const { data } = await supabase.from("questionnaires").select("id").eq("owner_id", user.id).limit(1);
  return !!data && data.length > 0;
}

/** 현재 로그인한 유저가 만든 모든 질문지 목록 (최신순), 각 질문지의 답변 수/안읽음 수 포함. */
export async function getMyQuestionnaires(): Promise<MyQuestionnaireSummary[]> {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user;
  if (!user) return [];

  const { data: qns } = await supabase
    .from("questionnaires")
    .select("id, questions, created_at")
    .eq("owner_id", user.id)
    .eq("visibility", "active")
    .order("created_at", { ascending: false });
  if (!qns || qns.length === 0) return [];

  const ids = qns.map((q: any) => q.id);
  const { data: resp } = await supabase
    .from("responses")
    .select("questionnaire_id, is_read")
    .in("questionnaire_id", ids)
    .eq("visibility", "active");

  const counts = new Map<string, { total: number; unread: number }>();
  for (const row of resp ?? []) {
    const c = counts.get(row.questionnaire_id) ?? { total: 0, unread: 0 };
    c.total += 1;
    if (!row.is_read) c.unread += 1;
    counts.set(row.questionnaire_id, c);
  }

  return qns.map((q: any) => {
    const c = counts.get(q.id) ?? { total: 0, unread: 0 };
    return {
      id: q.id,
      questions: q.questions as string[],
      createdAt: q.created_at,
      responseCount: c.total,
      unreadCount: c.unread,
    };
  });
}

/** 특정 질문지에 달린 답변(응답자) 목록 — 숨김/영구삭제 제외, 최신순. */
export async function getResponsesForQuestionnaire(questionnaireId: string): Promise<QuestionResponse[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("responses")
    .select("*")
    .eq("questionnaire_id", questionnaireId)
    .eq("visibility", "active")
    .order("created_at", { ascending: false });
  return (data ?? []).map(rowToResponse);
}

/** 답변 하나를 "읽음" 처리합니다 (본인 질문지의 답변만 가능). */
export async function markResponseRead(responseId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("user_mark_response_read", { p_response_id: responseId });
  if (error) throw error;
}

/** 유저 본인이 받은 답변을 자기 화면에서만 숨깁니다 (관리자는 계속 조회/복구 가능). */
export async function hideMyResponse(responseId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("user_hide_own_response", { p_response_id: responseId });
  if (error) throw error;
}

/** 질문지를 "삭제"합니다 — 실제로는 완전히 지우지 않고 본인 화면에서만 숨깁니다.
 * 관리자 페이지에서는 삭제된 뒤에도 계속 조회할 수 있고, 필요하면 복구할 수 있습니다.
 * (2026-09: 예전엔 진짜 DELETE를 썼는데, RLS로 막히면 PostgREST가 에러 없이 "0건 삭제
 * 성공"으로 응답해서 새로고침하면 다시 나타나는 버그가 있었습니다. 다른 숨김/복구 기능과
 * 동일하게 SECURITY DEFINER RPC로 바꿔서 이 문제도 함께 해결했습니다.) */
export async function deleteMyQuestionnaire(questionnaireId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("user_delete_own_questionnaire", {
    p_questionnaire_id: questionnaireId,
  });
  if (error) throw error;
}
