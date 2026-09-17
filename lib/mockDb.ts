// ⚠️ 이 파일은 실제 백엔드가 아닙니다.
// 브라우저 localStorage를 DB처럼 흉내 낸 "목(mock)" 계층입니다.
// 함수 시그니처를 실제 Supabase 쿼리와 최대한 비슷하게 맞춰뒀기 때문에,
// 나중에는 이 파일 내부 구현만 Supabase 클라이언트 호출로 바꾸면
// 컴포넌트 쪽 코드는 거의 손대지 않아도 됩니다.
//
// 실제 서비스 전환 시 반드시 지킬 것 (보안):
// 1. 아래 함수들은 지금 클라이언트(브라우저)에서 그대로 실행되지만,
//    실서비스에서는 admin* 함수들은 반드시 서버(Route Handler / Server Action)에서만
//    실행되고, 그 서버 코드가 "요청자가 실제로 관리자 role인지"를 세션으로 검증해야 합니다.
//    Supabase라면 RLS 정책으로 "admin role만 UPDATE/DELETE 가능"을 DB 레벨에서 강제하세요.
// 2. 영구 삭제(purge)는 되돌릴 수 없는 만큼, 실서비스에서는 최소 2단계 확인
//    (비밀번호 재입력 등) + 별도 관리자 계정으로만 허용하는 걸 권장합니다.
// 3. 생년월일처럼 민감한 선택 정보는 꼭 필요한 화면에서만 조회하고,
//    목록 화면 등 노출 범위가 넓은 곳에서는 마스킹(예: 2001-**-**) 처리하세요.

import { readJSON, writeJSON } from "./storage";
import type {
  AdminAuditLog,
  AppUser,
  Questionnaire,
  QuestionResponse,
} from "./types";

const KEYS = {
  users: "iwkm_admin_users",
  questionnaires: "iwkm_admin_questionnaires",
  responses: "iwkm_admin_responses",
  auditLog: "iwkm_admin_audit_log",
} as const;

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

function nowISO() {
  return new Date().toISOString();
}

// ---------------- 초기 목(mock) 데이터 시드 ----------------
// 처음 앱을 열었을 때 관리자 페이지가 비어 보이지 않도록 예시 데이터를 채워둡니다.
function seedIfEmpty() {
  const users = readJSON<AppUser[]>(KEYS.users, []);
  if (users.length > 0) return;

  const sampleNames = [
    "김지수", "이서연", "박민준", "최유진", "정하늘",
    "강태오", "윤소미", "장현우", "임채원", "한도윤",
    "오세영", "신아름", "배준서", "황수빈", "송민재",
  ];

  const seededUsers: AppUser[] = sampleNames.map((name, i) => ({
    id: uid("user"),
    kakaoId: `kakao_${1000000 + i}`,
    name,
    birthDate: i % 3 === 0 ? null : `199${i % 9}-0${(i % 9) + 1}-1${i % 9}`,
    createdAt: new Date(Date.now() - i * 86_400_000 * 3).toISOString(),
    consent: {
      termsAgreedAt: new Date(Date.now() - i * 86_400_000 * 3).toISOString(),
      privacyRequiredAgreedAt: new Date(Date.now() - i * 86_400_000 * 3).toISOString(),
      privacyOptionalAgreedAt:
        i % 3 === 0 ? null : new Date(Date.now() - i * 86_400_000 * 3).toISOString(),
    },
    status: i === 4 ? "suspended" : "active",
  }));

  const seededQuestionnaires: Questionnaire[] = seededUsers.map((u) => ({
    id: uid("qn"),
    ownerId: u.id,
    questions: [
      "내 성격을 한마디로 표현한다면?",
      "나의 첫인상은 어땠어?",
      "나에 대해 들은 소문 중에 제일 어이없었던 건?",
      "나랑 있을 때 가장 편했던 순간은?",
    ],
    relationRequired: true,
    finalMessageRequired: true,
    createdAt: u.createdAt,
  }));

  const seededResponses: QuestionResponse[] = seededQuestionnaires.flatMap((qn, qi) =>
    Array.from({ length: (qi % 4) + 1 }).map((_, ri) => ({
      id: uid("resp"),
      questionnaireId: qn.id,
      nickname: ri % 2 === 0 ? null : `친구${ri}`,
      isAnonymous: ri % 2 === 0,
      relationDuration: ["1년 미만", "1년", "2년", "3년", "5년 이상"][ri % 5],
      relationCloseness: (["악연", "지인", "친구", "인연"] as const)[ri % 4],
      finalMessage: "항상 응원할게, 앞으로도 잘 지내자!",
      answers: {
        0: "털털하고 솔직한 편",
        1: "생각보다 훨씬 다정했음",
        2: "연예인이랑 사귄다는 소문 ㅋㅋ",
        3: "같이 야식 먹으면서 수다 떨 때",
      },
      visibility: ri === 0 && qi === 2 ? "hidden_by_user" : "active",
      createdAt: new Date(Date.now() - ri * 3600_000).toISOString(),
      moderatedAt: null,
    }))
  );

  writeJSON(KEYS.users, seededUsers);
  writeJSON(KEYS.questionnaires, seededQuestionnaires);
  writeJSON(KEYS.responses, seededResponses);
  writeJSON<AdminAuditLog[]>(KEYS.auditLog, []);
}

// ---------------- 조회 ----------------

export function listUsers(params: {
  search?: string;
  page: number; // 1-based
  pageSize: number;
}): { users: AppUser[]; total: number } {
  seedIfEmpty();
  const all = readJSON<AppUser[]>(KEYS.users, []);
  const q = (params.search ?? "").trim().toLowerCase();
  const filtered = q
    ? all.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.kakaoId.toLowerCase().includes(q)
      )
    : all;
  const start = (params.page - 1) * params.pageSize;
  const paged = filtered.slice(start, start + params.pageSize);
  return { users: paged, total: filtered.length };
}

export function getUser(userId: string): AppUser | undefined {
  seedIfEmpty();
  return readJSON<AppUser[]>(KEYS.users, []).find((u) => u.id === userId);
}

export function getQuestionnaireByOwner(ownerId: string): Questionnaire | undefined {
  seedIfEmpty();
  return readJSON<Questionnaire[]>(KEYS.questionnaires, []).find(
    (q) => q.ownerId === ownerId
  );
}

export function listResponses(questionnaireId: string): QuestionResponse[] {
  seedIfEmpty();
  return readJSON<QuestionResponse[]>(KEYS.responses, []).filter(
    (r) => r.questionnaireId === questionnaireId
  );
}

export function listAuditLog(targetId?: string): AdminAuditLog[] {
  const logs = readJSON<AdminAuditLog[]>(KEYS.auditLog, []);
  const filtered = targetId ? logs.filter((l) => l.targetId === targetId) : logs;
  return filtered.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

// ---------------- 관리자 액션 ----------------
// 실서비스에서는 이 아래 함수들이 서버(Route Handler)에서만 호출되어야 하고,
// 호출 전에 반드시 "요청자가 admin role인지" 세션 검증을 거쳐야 합니다.

function appendAuditLog(entry: Omit<AdminAuditLog, "id" | "createdAt">) {
  const logs = readJSON<AdminAuditLog[]>(KEYS.auditLog, []);
  logs.push({ ...entry, id: uid("log"), createdAt: nowISO() });
  writeJSON(KEYS.auditLog, logs);
}

function updateResponse(
  responseId: string,
  patch: Partial<QuestionResponse>
): QuestionResponse | undefined {
  const responses = readJSON<QuestionResponse[]>(KEYS.responses, []);
  const idx = responses.findIndex((r) => r.id === responseId);
  if (idx === -1) return undefined;
  responses[idx] = { ...responses[idx], ...patch, moderatedAt: nowISO() };
  writeJSON(KEYS.responses, responses);
  return responses[idx];
}

/** 유저가 자기 화면에서 "삭제"를 누른 경우 — 실제로는 숨김 처리만 됨 */
export function hideResponseAsUser(responseId: string) {
  updateResponse(responseId, { visibility: "hidden_by_user" });
  appendAuditLog({
    actorId: "system",
    actorLabel: "유저 본인",
    action: "hide_response",
    targetType: "response",
    targetId: responseId,
    note: "유저가 자신의 화면에서 답변을 삭제함 (관리자에게는 계속 조회/복구 가능)",
  });
}

/** 관리자가 직접 답변을 숨김 처리 (부적절한 내용 신고 대응 등) — 영구삭제와 달리 되돌릴 수 있음 */
export function hideResponseAsAdmin(
  responseId: string,
  admin: { id: string; label: string }
) {
  updateResponse(responseId, { visibility: "hidden_by_user" });
  appendAuditLog({
    actorId: admin.id,
    actorLabel: admin.label,
    action: "hide_response",
    targetType: "response",
    targetId: responseId,
    note: "관리자가 직접 숨김 처리함",
  });
}

/** 관리자가 숨겨진 답변을 되돌림 */
export function restoreResponse(
  responseId: string,
  admin: { id: string; label: string }
) {
  updateResponse(responseId, { visibility: "active" });
  appendAuditLog({
    actorId: admin.id,
    actorLabel: admin.label,
    action: "restore_response",
    targetType: "response",
    targetId: responseId,
  });
}

/** 관리자 영구 삭제 — 관리자도 되돌릴 수 없음 */
export function purgeResponse(
  responseId: string,
  admin: { id: string; label: string }
) {
  updateResponse(responseId, { visibility: "purged" });
  appendAuditLog({
    actorId: admin.id,
    actorLabel: admin.label,
    action: "purge_response",
    targetType: "response",
    targetId: responseId,
    note: "영구 삭제 — 이후 어떤 관리자도 복구할 수 없음",
  });
}

export function setUserSuspended(
  userId: string,
  suspended: boolean,
  admin: { id: string; label: string }
) {
  const users = readJSON<AppUser[]>(KEYS.users, []);
  const idx = users.findIndex((u) => u.id === userId);
  if (idx === -1) return;
  users[idx] = { ...users[idx], status: suspended ? "suspended" : "active" };
  writeJSON(KEYS.users, users);
  appendAuditLog({
    actorId: admin.id,
    actorLabel: admin.label,
    action: suspended ? "suspend_user" : "unsuspend_user",
    targetType: "user",
    targetId: userId,
  });
}
