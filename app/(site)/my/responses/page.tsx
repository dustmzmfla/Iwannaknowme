"use client";

import { useCallback, useEffect, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import {
  deleteMyQuestionnaire,
  getMyQuestionnaires,
  getResponsesForQuestionnaire,
  hideMyResponse,
  markResponseRead,
  type MyQuestionnaireSummary,
} from "@/lib/creatorFlow";
import type { QuestionResponse } from "@/lib/types";
import { generateShareCardPng, downloadBlob } from "@/lib/shareCard";

// 표 한 페이지에 보여줄 최대 행 개수입니다.
const PAGE_SIZE = 10;

type Stage = "list" | "respondents" | "detail";

// 질문지 목록 표에서 "만든 날짜"를 0000.00.00 형식으로 보여주기 위한 헬퍼입니다.
function formatDotDate(iso: string) {
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

// 표 아래에 붙는 "이전 / N of M / 다음" 페이지 넘김 컨트롤입니다. 페이지가 1개뿐이면
// 아무것도 렌더링하지 않습니다.
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-center gap-3 py-2.5 border-t border-black/10 text-[12px]">
      <button
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
        className="font-bold px-2.5 py-1 border border-black/15 disabled:opacity-30 active:bg-black/[0.04] transition-colors"
      >
        이전
      </button>
      <span className="text-ink-soft">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        disabled={page >= totalPages}
        className="font-bold px-2.5 py-1 border border-black/15 disabled:opacity-30 active:bg-black/[0.04] transition-colors"
      >
        다음
      </button>
    </div>
  );
}

export default function MyResponsesPage() {
  const [stage, setStage] = useState<Stage>("list");

  const [loadingList, setLoadingList] = useState(true);
  const [questionnaires, setQuestionnaires] = useState<MyQuestionnaireSummary[]>([]);
  const [listError, setListError] = useState(false);

  const [loadingRespondents, setLoadingRespondents] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<MyQuestionnaireSummary | null>(null);
  const [respondents, setRespondents] = useState<QuestionResponse[]>([]);

  const [selectedResponse, setSelectedResponse] = useState<QuestionResponse | null>(null);
  const [hiding, setHiding] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmDeleteQnOpen, setConfirmDeleteQnOpen] = useState(false);
  const [deletingQn, setDeletingQn] = useState(false);

  const [listPage, setListPage] = useState(1);
  const [respondentsPage, setRespondentsPage] = useState(1);

  const { showToast } = useToast();

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    setListError(false);
    try {
      const list = await getMyQuestionnaires();
      setQuestionnaires(list);
      setListPage(1);
    } catch (err) {
      console.error("질문지 목록을 불러오지 못했습니다:", err);
      setListError(true);
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  async function openQuestionnaire(q: MyQuestionnaireSummary) {
    setSelectedQuestionnaire(q);
    setStage("respondents");
    setRespondentsPage(1);
    setLoadingRespondents(true);
    const list = await getResponsesForQuestionnaire(q.id);
    setRespondents(list);
    setLoadingRespondents(false);
  }

  async function handleCopyLink(e: React.MouseEvent, questionnaireId: string) {
    e.stopPropagation();
    const link = `${window.location.origin}/r/${questionnaireId}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // 클립보드 권한이 없는 브라우저 대비 — 실패해도 조용히 무시합니다.
    }
    setCopiedId(questionnaireId);
    setTimeout(() => setCopiedId((prev) => (prev === questionnaireId ? null : prev)), 1600);
    showToast("URL이 복사되었습니다.");
  }

  async function openResponse(r: QuestionResponse) {
    setSelectedResponse(r);
    setStage("detail");
    if (!r.isRead) {
      try {
        await markResponseRead(r.id);
        setRespondents((prev) => prev.map((item) => (item.id === r.id ? { ...item, isRead: true } : item)));
        setSelectedResponse((prev) => (prev && prev.id === r.id ? { ...prev, isRead: true } : prev));
        setQuestionnaires((prev) =>
          prev.map((q) =>
            q.id === r.questionnaireId ? { ...q, unreadCount: Math.max(0, q.unreadCount - 1) } : q
          )
        );
      } catch {
        // 읽음 처리 실패는 조용히 무시 — 답변을 보는 것 자체는 막지 않습니다.
      }
    }
  }

  function backToList() {
    setStage("list");
    setSelectedQuestionnaire(null);
    setRespondents([]);
    setSelectedResponse(null);
  }

  function backToRespondents() {
    setStage("respondents");
    setSelectedResponse(null);
    setRespondentsPage(1);
  }

  async function handleShare() {
    if (!selectedQuestionnaire || !selectedResponse) return;
    setSharing(true);
    try {
      const qa = selectedQuestionnaire.questions
        .map((q, i) => ({ question: q, answer: selectedResponse.answers[i] }))
        .filter((item): item is { question: string; answer: string } => Boolean(item.answer));
      const blob = await generateShareCardPng({
        isAnonymous: selectedResponse.isAnonymous,
        nickname: selectedResponse.nickname ?? "",
        qa,
        finalMessage: selectedResponse.finalMessage,
      });
      downloadBlob(blob, `내가누구게_${selectedResponse.id}.png`);
      showToast("이미지로 저장했어요.");
    } catch (err) {
      console.error("공유 이미지 생성 실패:", err);
      showToast("이미지를 만들지 못했어요. 잠시 후 다시 시도해줘.");
    } finally {
      setSharing(false);
    }
  }

  async function handleHide(responseId: string) {
    setHiding(true);
    try {
      await hideMyResponse(responseId);
      setRespondents((prev) => prev.filter((r) => r.id !== responseId));
      if (selectedQuestionnaire) {
        setQuestionnaires((prev) =>
          prev.map((q) =>
            q.id === selectedQuestionnaire.id
              ? { ...q, responseCount: Math.max(0, q.responseCount - 1) }
              : q
          )
        );
      }
      backToRespondents();
    } catch {
      alert("삭제하지 못했어요. 잠시 후 다시 시도해줘.");
    } finally {
      setHiding(false);
    }
  }

  async function handleDeleteQuestionnaire() {
    if (!selectedQuestionnaire) return;
    setDeletingQn(true);
    try {
      await deleteMyQuestionnaire(selectedQuestionnaire.id);
      const deletedId = selectedQuestionnaire.id;
      setQuestionnaires((prev) => prev.filter((q) => q.id !== deletedId));
      backToList();
      showToast("질문이 삭제되었습니다.");
    } catch (err) {
      // ⚠️ 진단용(2026-09): 실제 에러를 콘솔에 남기고, 알럿에도 짧게 보여줘서
      // 다음 실패 때 원인을 바로 알 수 있게 했습니다.
      console.error("질문 삭제 실패:", err);
      const detail = err instanceof Error ? err.message : String(err);
      alert(`삭제하지 못했어요. 잠시 후 다시 시도해줘.\n\n(진단 정보: ${detail})`);
    } finally {
      setDeletingQn(false);
    }
  }

  const listTotalPages = Math.max(1, Math.ceil(questionnaires.length / PAGE_SIZE));
  const pagedQuestionnaires = questionnaires.slice((listPage - 1) * PAGE_SIZE, listPage * PAGE_SIZE);

  const respondentsTotalPages = Math.max(1, Math.ceil(respondents.length / PAGE_SIZE));
  const pagedRespondents = respondents.slice(
    (respondentsPage - 1) * PAGE_SIZE,
    respondentsPage * PAGE_SIZE
  );

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      {stage === "list" ? (
        <BackButton fallbackHref="/" />
      ) : (
        <button
          onClick={stage === "detail" ? backToRespondents : backToList}
          aria-label="뒤로가기"
          className="w-[38px] h-[38px] rounded-full border-2 border-transparent bg-paper-card flex items-center justify-center mb-4 active:scale-95 active:border-accent focus-visible:border-accent transition"
        >
          ←
        </button>
      )}

      {stage === "list" && (
        <>
          <h2 className="font-display text-2xl mb-1.5">받은 답변</h2>
          <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
            내가 만든 질문지를 먼저 골라줘. 질문지마다 달린 답변을 따로 볼 수 있어.
          </p>

          {loadingList && <p className="text-sm text-ink-soft">불러오는 중...</p>}

          {!loadingList && listError && (
            <p className="text-sm text-accent">
              질문지 목록을 불러오지 못했어요. 잠시 후 다시 시도해줘 (콘솔에 자세한 원인이 남아요).
            </p>
          )}

          {!loadingList && !listError && questionnaires.length === 0 && (
            <p className="text-sm text-ink-soft">아직 만든 질문지가 없어요. 먼저 질문지를 만들어봐.</p>
          )}

          {questionnaires.length > 0 && (
            <div className="border border-black/10 bg-paper-card">
              <table className="w-full table-fixed text-center border-collapse">
                <colgroup>
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "30%" }} />
                  <col style={{ width: "30%" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-black/10">
                    <th className="px-2 py-2 text-[11px] font-bold text-ink-soft">만든날짜</th>
                    <th className="px-2 py-2 text-[11px] font-bold text-ink-soft">답변</th>
                    <th className="px-2 py-2 text-[11px] font-bold text-ink-soft">답변보기</th>
                    <th className="px-2 py-2 text-[11px] font-bold text-ink-soft">공유하기</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedQuestionnaires.map((q, i) => (
                    <tr
                      key={q.id}
                      onClick={() => openQuestionnaire(q)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openQuestionnaire(q);
                        }
                      }}
                      className={`border-b border-black/5 last:border-b-0 cursor-pointer hover:bg-black/[0.04] active:bg-black/[0.06] transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-paper-card"
                      }`}
                    >
                      <td className="px-2 py-2 text-[12px] text-ink-soft whitespace-nowrap">
                        {formatDotDate(q.createdAt)}
                      </td>
                      <td className="px-2 py-2 text-[12px] font-bold whitespace-nowrap">
                        {q.responseCount}개
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openQuestionnaire(q);
                          }}
                          className="text-[11px] font-bold px-2.5 py-1 border border-black/15 active:bg-black/[0.04] transition-colors"
                        >
                          보러가기
                        </button>
                      </td>
                      <td className="px-2 py-2 whitespace-nowrap">
                        <button
                          onClick={(e) => handleCopyLink(e, q.id)}
                          className="text-[11px] font-bold px-2.5 py-1 border border-black/15 active:bg-black/[0.04] transition-colors"
                        >
                          {copiedId === q.id ? "복사됨" : "링크 복사"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={listPage} totalPages={listTotalPages} onChange={setListPage} />
            </div>
          )}
        </>
      )}

      {stage === "respondents" && selectedQuestionnaire && (
        <>
          <h2 className="font-display text-2xl mb-1.5">답변한 친구들</h2>
          <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
            아래에서 눌러야 그 친구가 남긴 답변을 볼 수 있어요.
          </p>

          {loadingRespondents && <p className="text-sm text-ink-soft">불러오는 중...</p>}

          {!loadingRespondents && respondents.length === 0 && (
            <p className="text-sm text-ink-soft">아직 받은 답변이 없어요.</p>
          )}

          {respondents.length > 0 && (
            <div className="rounded-2xl border border-black/10 bg-paper-card overflow-hidden">
              <table className="w-full table-fixed text-left border-collapse">
                <colgroup>
                  <col />
                  <col style={{ width: "78px" }} />
                  <col style={{ width: "64px" }} />
                </colgroup>
                <thead>
                  <tr className="border-b border-black/10 bg-paper-card2/60">
                    <th className="px-3 py-2.5 text-[11px] font-bold text-ink-soft">이름</th>
                    <th className="px-3 py-2.5 text-[11px] font-bold text-ink-soft">친밀도</th>
                    <th className="px-3 py-2.5 text-[11px] font-bold text-ink-soft text-right">상태</th>
                  </tr>
                </thead>
                <tbody>
                  {pagedRespondents.map((r, i) => (
                    <tr
                      key={r.id}
                      onClick={() => openResponse(r)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          openResponse(r);
                        }
                      }}
                      className={`border-b border-black/5 last:border-b-0 cursor-pointer active:bg-black/[0.06] transition-colors ${
                        i % 2 === 0 ? "bg-white" : "bg-paper-card"
                      }`}
                    >
                      <td className="px-3 py-3 font-bold text-sm truncate">
                        {r.isAnonymous ? "익명" : r.nickname}
                      </td>
                      <td className="px-3 py-3">
                        <span className="inline-block text-[11px] bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                          {r.relationCloseness}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <span
                          className={`inline-block text-[10.5px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                            r.isRead ? "bg-black/5 text-ink-soft" : "bg-accent text-paper-card"
                          }`}
                        >
                          {r.isRead ? "읽음" : "안읽음"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Pagination page={respondentsPage} totalPages={respondentsTotalPages} onChange={setRespondentsPage} />
            </div>
          )}

          {/* 위쪽 버튼 하나로는 눈에 잘 안 띄어서 테이블 아래에도 링크를 노출합니다.
              링크 영역 자체가 버튼이에요 — 누르면 바로 복사되고 토스트로 알려줍니다. */}
          <div className="mt-2 mb-4">
            <div className="text-xs text-ink-soft mb-1.5">공유 링크</div>
            <button
              type="button"
              onClick={(e) => handleCopyLink(e, selectedQuestionnaire.id)}
              className="w-full text-left border border-black/15 rounded-xl px-3.5 py-3 text-[13px] font-bold break-all active:bg-black/[0.04] transition-colors"
            >
              {typeof window !== "undefined" ? window.location.origin : ""}/r/{selectedQuestionnaire.id}
            </button>
            <p className="text-[11px] text-accent font-bold mt-1.5">
              ※ 클릭하시면 URL이 자동으로 복사됩니다.
            </p>
          </div>

          {/* 링크 복사 버튼이 있던 자리 — 질문지 자체를 삭제하는 기능입니다. */}
          <button
            type="button"
            onClick={() => setConfirmDeleteQnOpen(true)}
            disabled={deletingQn}
            className="w-full py-2.5 rounded-xl border border-accent/40 text-accent text-sm font-bold active:bg-accent/5 disabled:opacity-50 transition-colors mb-4"
          >
            {deletingQn ? "삭제 중..." : "질문 삭제"}
          </button>

          <ConfirmDialog
            open={confirmDeleteQnOpen}
            title="질문을 삭제하시겠습니까?"
            description="질문을 삭제하면 해당 질문에 달린 답변들도 모두 삭제됩니다."
            confirmLabel="예"
            cancelLabel="아니오"
            danger
            onCancel={() => setConfirmDeleteQnOpen(false)}
            onConfirm={() => {
              setConfirmDeleteQnOpen(false);
              handleDeleteQuestionnaire();
            }}
          />
        </>
      )}

      {stage === "detail" && selectedQuestionnaire && selectedResponse && (
        <>
          <div className="flex items-center gap-2 mb-1.5">
            <h2 className="font-display text-2xl">
              {selectedResponse.isAnonymous ? "익명" : selectedResponse.nickname}
            </h2>
            <span className="text-xs bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full">
              {selectedResponse.relationCloseness}
            </span>
          </div>
          <p className="text-[13.5px] text-ink-soft mb-5">알고 지낸 기간 {selectedResponse.relationDuration}</p>

          <div className="space-y-3 mb-4">
            {selectedQuestionnaire.questions.map((q, i) =>
              selectedResponse.answers[i] ? (
                <div key={i} className="bg-paper-card border border-black/10 rounded-xl p-3.5">
                  <div className="text-xs text-ink-soft mb-1">{q}</div>
                  <div className="text-sm">{selectedResponse.answers[i]}</div>
                </div>
              ) : null
            )}
          </div>

          <div className="bg-paper-card2 rounded-xl px-3.5 py-3 text-sm mb-4">
            💌 {selectedResponse.finalMessage}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">
              {new Date(selectedResponse.createdAt).toLocaleString("ko-KR")}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                disabled={sharing}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-accent/40 text-accent disabled:opacity-50"
              >
                {sharing ? "만드는 중..." : "공유하기"}
              </button>
              <button
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={hiding}
                className="text-xs font-bold px-3 py-1.5 rounded-lg border border-black/15 disabled:opacity-50"
              >
                {hiding ? "삭제 중..." : "삭제"}
              </button>
            </div>
          </div>

          <ConfirmDialog
            open={confirmDeleteOpen}
            title="답변을 삭제하시겠습니까?"
            description="삭제하면 답변을 더 이상 볼 수 없어요"
            confirmLabel="예"
            cancelLabel="아니오"
            danger
            onCancel={() => setConfirmDeleteOpen(false)}
            onConfirm={() => {
              setConfirmDeleteOpen(false);
              handleHide(selectedResponse.id);
            }}
          />
        </>
      )}
    </section>
  );
}
