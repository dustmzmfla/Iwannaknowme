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
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  const { data } = await supabase
    .from("questionnaires")
    .select("id, creator_name, questions, created_at")
    .eq("id", id)
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

// ---------------- "받은 답변 보기" (네비게이션 메뉴) ----------------

export interface MyQuestionnaireSummary {
  id: string;
  questions: string[];
  createdAt: string;
}

/** 현재 로그인한 유저가 가장 최근에 만든 질문지 + 거기 달린 답변(숨김/영구삭제 제외)을 가져옵니다. */
export async function getMyResponses(): Promise<{
  questionnaire: MyQuestionnaireSummary | null;
  responses: QuestionResponse[];
}> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { questionnaire: null, responses: [] };

  const { data: qn } = await supabase
    .from("questionnaires")
    .select("id, questions, created_at")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!qn) return { questionnaire: null, responses: [] };

  const { data: resp } = await supabase
    .from("responses")
    .select("*")
    .eq("questionnaire_id", qn.id)
    .eq("visibility", "active")
    .order("created_at", { ascending: false });

  return {
    questionnaire: { id: qn.id, questions: qn.questions as string[], createdAt: qn.created_at },
    responses: (resp ?? []).map((row: any) => ({
      id: row.id,
      questionnaireId: row.questionnaire_id,
      nickname: row.nickname,
      isAnonymous: row.is_anonymous,
      relationDuration: row.relation_duration,
      relationCloseness: row.relation_closeness,
      finalMessage: row.final_message,
      answers: row.answers ?? {},
      visibility: row.visibility,
      createdAt: row.created_at,
      moderatedAt: row.moderated_at,
    })),
  };
}

/** 유저 본인이 받은 답변을 자기 화면에서만 숨깁니다 (관리자는 계속 조회/복구 가능). */
export async function hideMyResponse(responseId: string) {
  const supabase = createClient();
  const { error } = await supabase.rpc("user_hide_own_response", { p_response_id: responseId });
  if (error) throw error;
}
