"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  getUser,
  listQuestionnairesByOwner,
  listResponses,
  hideResponseAsAdmin,
  restoreResponse,
  purgeResponse,
  setUserSuspended,
  listAuditLog,
  addAdmin,
  removeAdmin,
} from "@/lib/mockDb";
import { ResponseCard } from "@/components/admin/ResponseCard";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { Pagination } from "@/components/admin/Pagination";
import type { AppUser, Questionnaire, QuestionResponse, AdminAuditLog } from "@/lib/types";

const QUESTIONNAIRES_PAGE_SIZE = 10;
const RESPONSES_PAGE_SIZE = 10;

function maskKakaoId(id: string) {
  if (id.length <= 4) return id;
  return id.slice(0, 4) + "*".repeat(id.length - 4);
}

// "생성일자" 컬럼용 — 0000.00.00 뒤에 시:분:초를 붙여서 보여줍니다.
function formatCreatedAt(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return { date: `${yyyy}.${mm}.${dd}`, time: `${hh}:${min}:${ss}` };
}

// "받은 답변" / "관리자 활동 로그" 처럼 펼치고 접을 수 있는 섹션 카드입니다.
function AccordionSection({
  title,
  open,
  onToggle,
  children,
}: {
  title: React.ReactNode;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-black/10 mb-4 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 text-left"
      >
        <h2 className="font-bold">{title}</h2>
        <span
          className={`text-ink-soft text-sm transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▾
        </span>
      </button>
      {open && <div className="px-6 pb-6 border-t border-black/5 pt-4">{children}</div>}
    </div>
  );
}

// Next.js 15에서 params가 Promise가 되면서 페이지 컴포넌트 prop으로 직접
// 받으면 "params.userId를 React.use()로 풀어써야 한다"는 경고가 뜹니다 — 이 페이지는
// 클라이언트 컴포넌트라 prop 대신 useParams() 훅으로 라우트 파라미터를 읽어서
// 경고 없이 동일하게 동작하도록 했습니다.
export default function AdminUserDetailPage() {
  const params = useParams<{ userId: string }>();
  const [user, setUser] = useState<AppUser | null>(null);

  // 유저 한 명이 "새 질문 생성"으로 질문지를 여러 개 만들 수 있어서, 질문지(메인 질문)
  // 단위로 목록을 갖고 있다가 하나를 고르면 그 질문지의 하위 질문/답변만 보여줍니다.
  // 이렇게 안 하면 서로 다른 질문지의 하위 질문 인덱스가 섞여서 답변이 꼬여요.
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [responsesByQuestionnaire, setResponsesByQuestionnaire] = useState<
    Record<string, QuestionResponse[]>
  >({});
  const [selectedQuestionnaireId, setSelectedQuestionnaireId] = useState<string | null>(null);

  const [auditLog, setAuditLog] = useState<AdminAuditLog[]>([]);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [confirmAdminToggle, setConfirmAdminToggle] = useState(false);
  const [adminBusy, setAdminBusy] = useState(false);
  const [showFullBirth, setShowFullBirth] = useState(false);
  const [loading, setLoading] = useState(true);

  // 작성한 질문 / 받은 답변 / 활동 로그 아코디언 펼침 상태 — 질문과 답변이 핵심
  // 정보라 기본으로 펼쳐두고, 로그는 자주 안 볼 테니 기본으로 접어뒀어요.
  const [questionsOpen, setQuestionsOpen] = useState(true);
  const [responsesOpen, setResponsesOpen] = useState(true);
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  const [questionnairesPage, setQuestionnairesPage] = useState(1);
  const [responsesPage, setResponsesPage] = useState(1);
  const [selectedResponse, setSelectedResponse] = useState<QuestionResponse | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const u = (await getUser(params.userId)) ?? null;
    setUser(u);

    const qns = await listQuestionnairesByOwner(params.userId);
    setQuestionnaires(qns);
    setQuestionnairesPage(1);
    setResponsesPage(1);

    const pairs = await Promise.all(
      qns.map(async (q) => [q.id, await listResponses(q.id)] as const)
    );
    const map: Record<string, QuestionResponse[]> = {};
    for (const [id, resps] of pairs) map[id] = resps;
    setResponsesByQuestionnaire(map);

    setSelectedQuestionnaireId((prev) =>
      prev && qns.some((q) => q.id === prev) ? prev : qns[0]?.id ?? null
    );

    const allResponseIds = pairs.flatMap(([, resps]) => resps.map((r) => r.id));
    const targetIds = [params.userId, ...allResponseIds];
    const logs = await listAuditLog();
    setAuditLog(logs.filter((l) => targetIds.includes(l.targetId)));

    setLoading(false);
  }, [params.userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  // 팝업으로 띄운 답변을 숨기거나 복구하면 목록이 갱신될 때 팝업 내용도 같이
  // 최신화됩니다 (영구삭제는 각 처리 함수에서 팝업을 바로 닫아요).
  useEffect(() => {
    setSelectedResponse((prev) => {
      if (!prev) return prev;
      const list = responsesByQuestionnaire[prev.questionnaireId] ?? [];
      return list.find((r) => r.id === prev.id) ?? prev;
    });
  }, [responsesByQuestionnaire]);

  if (loading) {
    return <p className="text-ink-soft">불러오는 중...</p>;
  }

  if (!user) {
    return (
      <div>
        <Link href="/admin" className="text-accent text-sm">
          ← 목록으로
        </Link>
        <p className="mt-4 text-ink-soft">유저를 찾을 수 없어요.</p>
      </div>
    );
  }

  const selectedQuestionnaire =
    questionnaires.find((q) => q.id === selectedQuestionnaireId) ?? null;
  const responses = selectedQuestionnaireId
    ? responsesByQuestionnaire[selectedQuestionnaireId] ?? []
    : [];

  const visibleResponses = responses.filter((r) => r.visibility !== "purged");
  const pagedResponses = visibleResponses.slice(
    (responsesPage - 1) * RESPONSES_PAGE_SIZE,
    responsesPage * RESPONSES_PAGE_SIZE
  );

  const pagedQuestionnaires = questionnaires.slice(
    (questionnairesPage - 1) * QUESTIONNAIRES_PAGE_SIZE,
    questionnairesPage * QUESTIONNAIRES_PAGE_SIZE
  );

  function selectQuestionnaire(id: string) {
    setSelectedQuestionnaireId(id);
    setResponsesPage(1);
  }

  return (
    <div>
      {/* "목록으로"는 왼쪽, 계정 정지/관리자 해제 같은 버튼들은 같은 줄 오른쪽 끝에 */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <Link href="/admin" className="text-accent text-sm">
          ← 목록으로
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setConfirmSuspend(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-black/15"
          >
            {user.status === "suspended" ? "정지 해제" : "계정 정지"}
          </button>
          <button
            onClick={() => setConfirmAdminToggle(true)}
            className={`text-xs font-bold px-3 py-1.5 rounded-lg border ${
              user.role === "admin" ? "border-accent/40 text-accent" : "border-black/15"
            }`}
          >
            {user.role === "admin" ? "관리자 해제" : "관리자로 지정"}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-black/10 p-6 mb-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">
              {user.name}{" "}
              {user.role === "admin" && (
                <span className="text-xs bg-ink text-paper-card px-2 py-0.5 rounded-full align-middle">
                  관리자
                </span>
              )}
            </h1>
            <p className="text-sm text-ink-soft">카카오 아이디: {maskKakaoId(user.kakaoId)}</p>
            <p className="text-sm text-ink-soft">
              생년월일:{" "}
              {user.birthDate ? (
                showFullBirth ? (
                  user.birthDate
                ) : (
                  <>
                    {user.birthDate.slice(0, 4)}-**-**{" "}
                    <button
                      onClick={() => setShowFullBirth(true)}
                      className="text-accent underline text-xs"
                    >
                      전체 보기
                    </button>
                  </>
                )
              ) : (
                "선택 항목 미동의"
              )}
            </p>
            <p className="text-sm text-ink-soft">
              가입일: {new Date(user.createdAt).toLocaleString("ko-KR")}
            </p>
          </div>

          <div className="text-right">
            <span
              className={`inline-block text-xs font-bold px-3 py-1 rounded-full ${
                user.status === "suspended"
                  ? "bg-accent/10 text-accent"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {user.status === "suspended" ? "정지됨" : "활성"}
            </span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-black/10 text-xs text-ink-soft space-y-0.5">
          <p>
            필수 개인정보 동의:{" "}
            {user.consent.privacyRequiredAgreedAt
              ? new Date(user.consent.privacyRequiredAgreedAt).toLocaleString("ko-KR")
              : "기록 없음"}
          </p>
          <p>
            선택 항목(생년월일 등) 동의:{" "}
            {user.consent.privacyOptionalAgreedAt
              ? new Date(user.consent.privacyOptionalAgreedAt).toLocaleString("ko-KR")
              : "미동의"}
          </p>
        </div>
      </div>

      {questionnaires.length > 0 && selectedQuestionnaire ? (
        <>
          <AccordionSection
            title={`작성한 질문 (질문지 ${questionnaires.length}개)`}
            open={questionsOpen}
            onToggle={() => setQuestionsOpen((v) => !v)}
          >
            {/* "새 질문 생성"으로 만든 질문지(메인 질문)마다 한 행입니다 — 생성 날짜로
                구분해서, 질문지가 늘어나도 하위 질문/답변이 서로 안 섞이게 해뒀어요.
                행을 누르면 그 질문지를 고르고, 아래 "받은 답변"에 그 질문지의
                답변자들이 뜹니다. */}
            <div className="border border-black/10 rounded-xl overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-black/[0.03] text-left text-xs text-black/50">
                    <th className="px-4 py-2.5 font-medium">생성일자</th>
                    <th className="px-4 py-2.5 font-medium">질문 수</th>
                    <th className="px-4 py-2.5 font-medium">답변 수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {pagedQuestionnaires.map((q) => {
                    const responseCount = (responsesByQuestionnaire[q.id] ?? []).filter(
                      (r) => r.visibility !== "purged"
                    ).length;
                    const isSelected = q.id === selectedQuestionnaireId;
                    return (
                      <tr
                        key={q.id}
                        onClick={() => selectQuestionnaire(q.id)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            selectQuestionnaire(q.id);
                          }
                        }}
                        className={`cursor-pointer hover:bg-black/[0.015] ${
                          isSelected ? "bg-accent/5" : ""
                        }`}
                      >
                        <td className="px-4 py-2.5 font-bold whitespace-nowrap">
                          {isSelected && <span className="text-accent mr-1">▸</span>}
                          {formatCreatedAt(q.createdAt).date}{" "}
                          <span className="font-normal text-black/40">
                            {formatCreatedAt(q.createdAt).time}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-black/60">{q.questions.length}개</td>
                        <td className="px-4 py-2.5 text-black/60">{responseCount}개</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Pagination
              page={questionnairesPage}
              pageSize={QUESTIONNAIRES_PAGE_SIZE}
              total={questionnaires.length}
              onChange={setQuestionnairesPage}
            />
          </AccordionSection>

          <AccordionSection
            title={
              <>
                받은 답변 ({visibleResponses.length}개
                {responses.length !== visibleResponses.length &&
                  `, 영구삭제 ${responses.length - visibleResponses.length}개 별도`}
                )
              </>
            }
            open={responsesOpen}
            onToggle={() => setResponsesOpen((v) => !v)}
          >
            {visibleResponses.length === 0 ? (
              <p className="text-sm text-ink-soft">아직 받은 답변이 없어요.</p>
            ) : (
              <>
                {/* 답변자 행을 누르면 팝업으로 이 질문지의 하위 질문 전체 + 그 사람이
                    적은 답변을 모두 확인할 수 있어요 (ResponseCard 재사용). */}
                <div className="border border-black/10 rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-black/[0.03] text-left text-xs text-black/50">
                        <th className="px-4 py-2.5 font-medium">이름</th>
                        <th className="px-4 py-2.5 font-medium">친밀도</th>
                        <th className="px-4 py-2.5 font-medium">제출일</th>
                        <th className="px-4 py-2.5 font-medium">상태</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5">
                      {pagedResponses.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => setSelectedResponse(r)}
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setSelectedResponse(r);
                            }
                          }}
                          className="cursor-pointer hover:bg-black/[0.015]"
                        >
                          <td className="px-4 py-2.5 font-bold">
                            {r.isAnonymous ? "익명" : r.nickname}
                          </td>
                          <td className="px-4 py-2.5 text-black/60">{r.relationCloseness}</td>
                          <td className="px-4 py-2.5 text-black/60">
                            {new Date(r.createdAt).toLocaleDateString("ko-KR")}
                          </td>
                          <td className="px-4 py-2.5">
                            {r.visibility === "hidden_by_user" ? (
                              <span className="text-xs font-bold text-ink-soft bg-black/10 px-2 py-0.5 rounded-full">
                                숨김
                              </span>
                            ) : (
                              <span className="text-xs font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full">
                                정상
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Pagination
                  page={responsesPage}
                  pageSize={RESPONSES_PAGE_SIZE}
                  total={visibleResponses.length}
                  onChange={setResponsesPage}
                />
              </>
            )}
          </AccordionSection>
        </>
      ) : (
        <p className="text-sm text-ink-soft mb-4">아직 만든 질문지가 없어요.</p>
      )}

      <AccordionSection
        title="관리자 활동 로그"
        open={auditLogOpen}
        onToggle={() => setAuditLogOpen((v) => !v)}
      >
        {auditLog.length === 0 ? (
          <p className="text-sm text-ink-soft">기록이 없어요.</p>
        ) : (
          <ul className="text-xs text-ink-soft space-y-1.5">
            {auditLog.map((log) => (
              <li key={log.id} className="flex justify-between gap-2 border-b border-black/5 pb-1.5">
                <span>
                  <b className="text-ink">{log.actorLabel}</b> · {actionLabel(log.action)}
                  {log.note ? ` — ${log.note}` : ""}
                </span>
                <span className="whitespace-nowrap">
                  {new Date(log.createdAt).toLocaleString("ko-KR")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </AccordionSection>

      {/* 답변 한 건을 누르면 뜨는 팝업 — 이미 만들어져 있는 ResponseCard를 그대로 재사용해요.
          화면 정중앙에 뜨고, 닫기 버튼은 팝업 안쪽(카드 우상단)에 겹쳐서 위치합니다. */}
      {selectedResponse && selectedQuestionnaire && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-10 overflow-y-auto"
          onClick={() => setSelectedResponse(null)}
        >
          <div className="relative w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setSelectedResponse(null)}
              aria-label="닫기"
              className="absolute top-3 right-3 z-10 w-8 h-8 rounded-full bg-black/55 hover:bg-black/70 transition-colors flex items-center justify-center"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="1.5" y1="1.5" x2="12.5" y2="12.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
                <line x1="12.5" y1="1.5" x2="1.5" y2="12.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
            <ResponseCard
              response={selectedResponse}
              questions={selectedQuestionnaire.questions}
              onHide={async () => {
                await hideResponseAsAdmin(selectedResponse.id);
                await refresh();
              }}
              onRestore={async () => {
                await restoreResponse(selectedResponse.id);
                await refresh();
              }}
              onPurge={async () => {
                await purgeResponse(selectedResponse.id);
                setSelectedResponse(null);
                await refresh();
              }}
            />
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmSuspend}
        title={user.status === "suspended" ? "정지를 해제할까요?" : "계정을 정지할까요?"}
        description={
          user.status === "suspended"
            ? "이 유저는 다시 정상적으로 서비스를 이용할 수 있게 됩니다."
            : "정지된 유저는 로그인은 가능하지만 새 질문지 생성 및 링크 공유가 제한됩니다."
        }
        confirmLabel={user.status === "suspended" ? "정지 해제" : "정지하기"}
        danger={user.status !== "suspended"}
        onCancel={() => setConfirmSuspend(false)}
        onConfirm={async () => {
          await setUserSuspended(user.id, user.status !== "suspended");
          setConfirmSuspend(false);
          refresh();
        }}
      />

      <ConfirmDialog
        open={confirmAdminToggle}
        title={
          user.role === "admin"
            ? "관리자 권한을 해제할까요?"
            : "관리자로 지정할까요?"
        }
        description={
          user.role === "admin"
            ? `'${user.name}' 계정은 더 이상 관리자 페이지에 접근할 수 없게 됩니다.`
            : `'${user.name}' 계정으로 로그인하면 바로 관리자 페이지에 접근할 수 있게 됩니다.`
        }
        confirmLabel={user.role === "admin" ? "관리자 해제" : "관리자로 지정"}
        danger={user.role === "admin"}
        onCancel={() => setConfirmAdminToggle(false)}
        onConfirm={async () => {
          if (adminBusy) return;
          setAdminBusy(true);
          try {
            if (user.role === "admin") {
              await removeAdmin(user.kakaoId);
            } else {
              await addAdmin(user.kakaoId, user.name);
            }
            setConfirmAdminToggle(false);
            await refresh();
          } catch (e: any) {
            alert(e?.message ?? "관리자 권한을 변경하지 못했어요.");
          } finally {
            setAdminBusy(false);
          }
        }}
      />
    </div>
  );
}

function actionLabel(action: AdminAuditLog["action"]) {
  switch (action) {
    case "hide_response":
      return "답변 숨김";
    case "restore_response":
      return "답변 복구";
    case "purge_response":
      return "답변 영구삭제";
    case "suspend_user":
      return "계정 정지";
    case "unsuspend_user":
      return "정지 해제";
    case "grant_admin":
      return "관리자 등록";
    case "revoke_admin":
      return "관리자 해제";
    case "delete_account":
      return "계정 삭제";
    default:
      return action;
  }
}
