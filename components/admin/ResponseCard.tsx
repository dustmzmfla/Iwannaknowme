"use client";

import { useState } from "react";
import { ConfirmDialog } from "./ConfirmDialog";
import type { QuestionResponse } from "@/lib/types";

export function ResponseCard({
  response,
  questions,
  onHide,
  onRestore,
  onPurge,
}: {
  response: QuestionResponse;
  questions: string[];
  onHide: () => void;
  onRestore: () => void;
  onPurge: () => void;
}) {
  const [confirmPurge, setConfirmPurge] = useState(false);
  const isHidden = response.visibility === "hidden_by_user";
  const isPurged = response.visibility === "purged";

  return (
    <div
      className={`rounded-2xl border p-4 mb-3 ${
        isHidden ? "bg-black/[0.03] border-dashed border-black/20" : "bg-white border-black/10"
      }`}
    >
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="font-bold">{response.isAnonymous ? "익명" : response.nickname}</span>
          <span className="text-xs bg-accent/10 text-accent font-bold px-2 py-0.5 rounded-full">
            {response.relationCloseness}
          </span>
          <span className="text-xs text-ink-soft">알고 지낸 기간 {response.relationDuration}</span>
        </div>
        {isHidden && (
          <span className="text-xs font-bold text-ink-soft bg-black/10 px-2 py-0.5 rounded-full">
            숨김 처리됨 (유저 화면에는 안 보임)
          </span>
        )}
      </div>

      <div className="space-y-2 mb-3">
        {questions.map((q, i) =>
          response.answers[i] ? (
            <div key={i}>
              <div className="text-xs text-ink-soft">{q}</div>
              <div className="text-sm">{response.answers[i]}</div>
            </div>
          ) : null
        )}
      </div>

      <div className="bg-paper-card2 rounded-xl px-3 py-2 text-sm mb-3">
        💌 {response.finalMessage}
      </div>

      <div className="flex items-center justify-between text-xs text-ink-soft mb-3">
        <span>제출: {new Date(response.createdAt).toLocaleString("ko-KR")}</span>
        {response.moderatedAt && (
          <span>최근 처리: {new Date(response.moderatedAt).toLocaleString("ko-KR")}</span>
        )}
      </div>

      {!isPurged && (
        <div className="flex gap-2">
          {isHidden ? (
            <button
              onClick={onRestore}
              className="text-xs font-bold px-3 py-1.5 rounded-lg bg-ink text-paper-card"
            >
              되돌리기 (복구)
            </button>
          ) : (
            <button
              onClick={onHide}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-black/15"
            >
              삭제 (유저에게 숨김)
            </button>
          )}
          <button
            onClick={() => setConfirmPurge(true)}
            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-accent text-accent"
          >
            영구 삭제
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmPurge}
        title="정말 영구 삭제할까요?"
        description="영구 삭제하면 이 답변은 관리자도 다시 복구할 수 없습니다. 신중하게 결정해주세요."
        confirmLabel="영구 삭제"
        danger
        requireTypedConfirm="영구삭제"
        onCancel={() => setConfirmPurge(false)}
        onConfirm={() => {
          onPurge();
          setConfirmPurge(false);
        }}
      />
    </div>
  );
}
