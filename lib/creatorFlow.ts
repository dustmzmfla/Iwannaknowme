// 이 파일은 "질문지 만들기 → 공유 → 답변받기" 실사용 흐름을 위한 저장 계층입니다.
// 지금은 localStorage 기반이라 브라우저 하나 안에서만 동작합니다.
// 실서비스 전환 시 이 파일의 함수 3개만 Supabase 쿼리로 교체하면 됩니다.
import { readJSON, writeJSON } from "./storage";

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
  relation: "악연" | "지인" | "친구" | "인연";
  finalMessage: string;
  answers: Record<number, string>;
  createdAt: string;
}

function uid() {
  return Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-4);
}

export function publishQuestionnaire(creatorName: string, questions: string[]): string {
  const id = uid();
  writeJSON<PublishedQuestionnaire>(`iwkm_page_${id}`, {
    id,
    creatorName,
    questions,
    createdAt: new Date().toISOString(),
  });
  return id;
}

export function getQuestionnaire(id: string): PublishedQuestionnaire | null {
  return readJSON<PublishedQuestionnaire | null>(`iwkm_page_${id}`, null);
}

export function submitResponse(id: string, response: SubmittedResponse) {
  const key = `iwkm_resp_${id}`;
  const list = readJSON<SubmittedResponse[]>(key, []);
  list.push(response);
  writeJSON(key, list);
}

export function listResponses(id: string): SubmittedResponse[] {
  return readJSON<SubmittedResponse[]>(`iwkm_resp_${id}`, []);
}
