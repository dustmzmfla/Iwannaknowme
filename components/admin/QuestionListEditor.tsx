"use client";

import { useRef, useState } from "react";
import { useDragReorder } from "@/lib/useDragReorder";
import type { QuestionBankItem } from "@/lib/types";

/**
 * 카테고리 하나 안의 질문 목록 - 드래그로 순서 변경(밀리는 애니메이션은
 * lib/useDragReorder의 로직 재사용, components/builder/SelectedQuestionList.tsx와
 * 동일한 방식) + 인라인 텍스트 수정을 담당합니다. 카테고리마다 이 컴포넌트가
 * 하나씩 인스턴스화되어서 useDragReorder 훅을 각자 독립적으로 가집니다.
 */
export function QuestionListEditor({
  items,
  busy,
  onToggleActive,
  onUpdateText,
  onDelete,
  onReorder,
}: {
  items: QuestionBankItem[];
  busy: boolean;
  onToggleActive: (q: QuestionBankItem) => void;
  onUpdateText: (q: QuestionBankItem, newText: string) => void;
  onDelete: (q: QuestionBankItem) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const { startDrag, moveDrag, endDrag } = useDragReorder(items, onReorder);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  function getSiblings(): HTMLElement[] {
    return Array.from(listRef.current?.querySelectorAll("[data-q-item]") ?? []) as HTMLElement[];
  }

  function startEdit(q: QuestionBankItem) {
    setEditingId(q.id);
    setEditText(q.text);
  }

  function saveEdit(q: QuestionBankItem) {
    const text = editText.trim();
    if (text && text !== q.text) onUpdateText(q, text);
    setEditingId(null);
  }

  if (items.length === 0) {
    return <p className="text-sm text-ink-soft py-2">아직 질문이 없어요.</p>;
  }

  return (
    <ul ref={listRef} className="space-y-1.5 mb-3">
      {items.map((q, i) => {
        const editing = editingId === q.id;
        return (
          <li
            key={q.id}
            data-q-item
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm will-change-transform ${
              q.isActive ? "bg-paper-card2" : "bg-black/[0.03] text-ink-soft line-through"
            }`}
            style={{ transition: "transform 220ms cubic-bezier(.2,.8,.2,1)" }}
          >
            <span
              className="text-ink-soft text-base px-0.5 cursor-grab touch-none shrink-0"
              onPointerDown={(e) => {
                if (editing) return;
                const itemEl = e.currentTarget.closest("[data-q-item]") as HTMLElement;
                startDrag(e, i, itemEl, getSiblings());
                itemEl.style.transition = "none";
                itemEl.style.zIndex = "20";
              }}
              onPointerMove={(e) => {
                const itemEl = e.currentTarget.closest("[data-q-item]") as HTMLElement;
                moveDrag(e, itemEl, getSiblings());
              }}
              onPointerUp={(e) => {
                const itemEl = e.currentTarget.closest("[data-q-item]") as HTMLElement;
                itemEl.style.transition = "";
                itemEl.style.zIndex = "";
                endDrag(itemEl, getSiblings());
              }}
            >
              ⠿
            </span>

            {editing ? (
              <>
                <input
                  autoFocus
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveEdit(q)}
                  className="flex-1 min-w-0 bg-white border border-black/15 rounded-lg px-2 py-1 text-sm"
                />
                <button
                  onClick={() => saveEdit(q)}
                  className="text-xs font-bold px-2 py-1 rounded-lg bg-ink text-paper-card shrink-0"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-xs font-bold px-2 py-1 rounded-lg border border-black/15 shrink-0"
                >
                  취소
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 min-w-0 break-words">{q.text}</span>
                <button
                  onClick={() => startEdit(q)}
                  disabled={busy}
                  className="text-xs font-bold px-2 py-1 rounded-lg border border-black/15 shrink-0"
                >
                  수정
                </button>
                <button
                  onClick={() => onToggleActive(q)}
                  disabled={busy}
                  className="text-xs font-bold px-2 py-1 rounded-lg border border-black/15 shrink-0"
                >
                  {q.isActive ? "비활성화" : "활성화"}
                </button>
                <button
                  onClick={() => onDelete(q)}
                  disabled={busy}
                  className="text-xs font-bold px-2 py-1 rounded-lg border border-accent/40 text-accent shrink-0"
                >
                  삭제
                </button>
              </>
            )}
          </li>
        );
      })}
    </ul>
  );
}
