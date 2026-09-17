"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getUser,
  getQuestionnaireByOwner,
  listResponses,
  hideResponseAsAdmin,
  restoreResponse,
  purgeResponse,
  setUserSuspended,
  listAuditLog,
} from "@/lib/mockDb";
import { CURRENT_ADMIN } from "@/lib/adminAuth";
import { ResponseCard } from "@/components/admin/ResponseCard";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { AppUser, Questionnaire, QuestionResponse, AdminAuditLog } from "@/lib/types";

function maskKakaoId(id: string) {
  if (id.length <= 4) return id;
  return id.slice(0, 4) + "*".repeat(id.length - 4);
}

export default function AdminUserDetailPage({ params }: { params: { userId: string } }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [auditLog, setAuditLog] = useState<AdminAuditLog[]>([]);
  const [confirmSuspend, setConfirmSuspend] = useState(false);
  const [showFullBirth, setShowFullBirth] = useState(false);

  function refresh() {
    const u = getUser(params.userId) ?? null;
    setUser(u);
    const qn = getQuestionnaireByOwner(params.userId) ?? null;
    setQuestionnaire(qn);
    const resps = qn ? listResponses(qn.id) : [];
    setResponses(resps);
    const targetIds = [params.userId, ...resps.map((r) => r.id)];
    setAuditLog(listAuditLog().filter((l) => targetIds.includes(l.targetId)));
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.userId]);

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

  const visibleResponses = responses.filter((r) => r.visibility !== "purged");

  return (
    <div>
      <Link href="/admin" className="text-accent text-sm">
        ← 목록으로
      </Link>

      <div className="bg-white rounded-2xl border border-black/10 p-6 my-4">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">{user.name}</h1>
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
              className={`inline-block text-xs font-bold px-3 py-1 rounded-full mb-2 ${
                user.status === "suspended"
                  ? "bg-accent/10 text-accent"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {user.status === "suspended" ? "정지됨" : "활성"}
            </span>
            <br />
            <button
              onClick={() => setConfirmSuspend(true)}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-black/15"
            >
              {user.status === "suspended" ? "정지 해제" : "계정 정지"}
            </button>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-black/10 text-xs text-ink-soft space-y-0.5">
          <p>필수 개인정보 동의: {new Date(user.consent.privacyRequiredAgreedAt).toLocaleString("ko-KR")}</p>
          <p>
            선택 항목(생년월일 등) 동의:{" "}
            {user.consent.privacyOptionalAgreedAt
              ? new Date(user.consent.privacyOptionalAgreedAt).toLocaleString("ko-KR")
              : "미동의"}
          </p>
        </div>
      </div>

      {questionnaire ? (
        <>
          <div className="bg-white rounded-2xl border border-black/10 p-6 mb-4">
            <h2 className="font-bold mb-3">작성한 질문 ({questionnaire.questions.length}개)</h2>
            <ol className="list-decimal pl-5 space-y-1 text-sm">
              {questionnaire.questions.map((q, i) => (
                <li key={i}>{q}</li>
              ))}
            </ol>
          </div>

          <h2 className="font-bold mb-3">
            받은 답변 ({visibleResponses.length}개
            {responses.length !== visibleResponses.length &&
              `, 영구삭제 ${responses.length - visibleResponses.length}개 별도`}
            )
          </h2>
          {visibleResponses.length === 0 && (
            <p className="text-sm text-ink-soft mb-4">아직 받은 답변이 없어요.</p>
          )}
          {visibleResponses.map((r) => (
            <ResponseCard
              key={r.id}
              response={r}
              questions={questionnaire.questions}
              onHide={() => {
                hideResponseAsAdmin(r.id, CURRENT_ADMIN);
                refresh();
              }}
              onRestore={() => {
                restoreResponse(r.id, CURRENT_ADMIN);
                refresh();
              }}
              onPurge={() => {
                purgeResponse(r.id, CURRENT_ADMIN);
                refresh();
              }}
            />
          ))}
        </>
      ) : (
        <p className="text-sm text-ink-soft">아직 만든 질문지가 없어요.</p>
      )}

      <div className="bg-white rounded-2xl border border-black/10 p-6 mt-6">
        <h2 className="font-bold mb-3">관리자 활동 로그</h2>
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
      </div>

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
        onConfirm={() => {
          setUserSuspended(user.id, user.status !== "suspended", CURRENT_ADMIN);
          setConfirmSuspend(false);
          refresh();
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
    default:
      return action;
  }
}
