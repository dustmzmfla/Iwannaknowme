"use client";

import { useCallback, useEffect, useState } from "react";
import { BackButton } from "@/components/ui/BackButton";
import { getMyResponses, hideMyResponse, type MyQuestionnaireSummary } from "@/lib/creatorFlow";
import type { QuestionResponse } from "@/lib/types";

export default function MyResponsesPage() {
  const [loading, setLoading] = useState(true);
  const [questionnaire, setQuestionnaire] = useState<MyQuestionnaireSummary | null>(null);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [hidingId, setHidingId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { questionnaire: qn, responses: resp } = await getMyResponses();
    setQuestionnaire(qn);
    setResponses(resp);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleHide(responseId: string) {
    setHidingId(responseId);
    try {
      await hideMyResponse(responseId);
      setResponses((prev) => prev.filter((r) => r.id !== responseId));
    } catch {
      alert("삭제하지 못했어요. 잠시 후 다시 시도해줘.");
    } finally {
      setHidingId(null);
    }
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/" />
      <h2 className="font-display text-2xl mb-1.5">받은 답변</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        가장 최근에 만든 질문지에 달린 답변을 볼 수 있어요.
      </p>

      {loading && <p className="text-sm text-ink-soft">불러오는 중...</p>}

      {!loading && !questionnaire && (
        <p className="text-sm text-ink-soft">
          아직 만든 질문지가 없어요. 먼저 질문지를 만들어봐.
        </p>
      )}

      {!loading && questionnaire && responses.length === 0 && (
        <p className="text-sm text-ink-soft">아직 받은 답변이 없어요.</p>
      )}

      {responses.map((r) => (
        <div key={r.id} className="bg-paper-card border border-black/10 rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between mb-2.5 flex-wrap gap-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold">{r.isAnonymous ? "익명" : r.nickname}</span>
              <span className="text-xs bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full">
                {r.relationCloseness}
              </span>
            </div>
            <span className="text-xs text-ink-soft">알고 지낸 기간 {r.relationDuration}</span>
          </div>

          <div className="space-y-2 mb-3">
            {questionnaire?.questions.map((q, i) =>
              r.answers[i] ? (
                <div key={i}>
                  <div className="text-xs text-ink-soft">{q}</div>
                  <div className="text-sm">{r.answers[i]}</div>
                </div>
              ) : null
            )}
          </div>

          <div className="bg-paper-card2 rounded-xl px-3 py-2 text-sm mb-3">💌 {r.finalMessage}</div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-ink-soft">
              {new Date(r.createdAt).toLocaleString("ko-KR")}
            </span>
            <button
              onClick={() => handleHide(r.id)}
              disabled={hidingId === r.id}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-black/15 disabled:opacity-50"
            >
              {hidingId === r.id ? "삭제 중..." : "삭제"}
            </button>
          </div>
        </div>
      ))}
    </section>
  );
}
