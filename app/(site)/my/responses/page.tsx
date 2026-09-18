"use client";

import { useCallback, useEffect, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import {
  getMyQuestionnaires,
  getResponsesForQuestionnaire,
  hideMyResponse,
  markResponseRead,
  type MyQuestionnaireSummary,
} from "@/lib/creatorFlow";
import type { QuestionResponse } from "@/lib/types";

type Stage = "list" | "respondents" | "detail";

export default function MyResponsesPage() {
  const [stage, setStage] = useState<Stage>("list");

  const [loadingList, setLoadingList] = useState(true);
  const [questionnaires, setQuestionnaires] = useState<MyQuestionnaireSummary[]>([]);

  const [loadingRespondents, setLoadingRespondents] = useState(false);
  const [selectedQuestionnaire, setSelectedQuestionnaire] = useState<MyQuestionnaireSummary | null>(null);
  const [respondents, setRespondents] = useState<QuestionResponse[]>([]);

  const [selectedResponse, setSelectedResponse] = useState<QuestionResponse | null>(null);
  const [hiding, setHiding] = useState(false);

  const refreshList = useCallback(async () => {
    setLoadingList(true);
    const list = await getMyQuestionnaires();
    setQuestionnaires(list);
    setLoadingList(false);
  }, []);

  useEffect(() => {
    refreshList();
  }, [refreshList]);

  async function openQuestionnaire(q: MyQuestionnaireSummary) {
    setSelectedQuestionnaire(q);
    setStage("respondents");
    setLoadingRespondents(true);
    const list = await getResponsesForQuestionnaire(q.id);
    setRespondents(list);
    setLoadingRespondents(false);
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

          {!loadingList && questionnaires.length === 0 && (
            <p className="text-sm text-ink-soft">아직 만든 질문지가 없어요. 먼저 질문지를 만들어봐.</p>
          )}

          {questionnaires.map((q) => (
            <button
              key={q.id}
              onClick={() => openQuestionnaire(q)}
              className="text-left w-full bg-paper-card border border-black/10 rounded-2xl p-4 mb-3 active:scale-[0.99] transition"
            >
              <div className="flex items-center justify-between mb-2 gap-2">
                <span className="font-bold text-[14.5px]">
                  질문 {q.questions.length}개 · {new Date(q.createdAt).toLocaleDateString("ko-KR")}
                </span>
                {q.unreadCount > 0 && (
                  <span className="shrink-0 text-xs font-bold text-paper-card bg-accent px-2 py-0.5 rounded-full">
                    안읽음 {q.unreadCount}
                  </span>
                )}
              </div>
              <p className="text-xs text-ink-soft truncate">{q.questions[0]}</p>
              <p className="text-xs text-ink-soft mt-1.5">답변 {q.responseCount}개</p>
            </button>
          ))}
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

          {respondents.map((r) => (
            <button
              key={r.id}
              onClick={() => openResponse(r)}
              className="text-left w-full flex items-center justify-between bg-paper-card border border-black/10 rounded-2xl p-4 mb-3 active:scale-[0.99] transition"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="font-bold truncate">{r.isAnonymous ? "익명" : r.nickname}</span>
                <span className="shrink-0 text-xs bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full">
                  {r.relationCloseness}
                </span>
              </div>
              <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                  r.isRead ? "bg-black/5 text-ink-soft" : "bg-accent text-paper-card"
                }`}
              >
                {r.isRead ? "읽음" : "안읽음"}
              </span>
            </button>
          ))}
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
            <button
              onClick={() => handleHide(selectedResponse.id)}
              disabled={hiding}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-black/15 disabled:opacity-50"
            >
              {hiding ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}
