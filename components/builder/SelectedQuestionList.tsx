"use client";

import { useRef } from "react";
import { useDragReorder } from "@/lib/useDragReorder";

export function SelectedQuestionList({
  items,
  onReorder,
  onRemove,
}: {
  items: string[];
  onReorder: (from: number, to: number) => void;
  onRemove: (text: string) => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);
  const { startDrag, moveDrag, endDrag } = useDragReorder(items, onReorder);

  function getSiblings(): HTMLElement[] {
    return Array.from(listRef.current?.querySelectorAll("[data-sel-item]") ?? []) as HTMLElement[];
  }

  if (items.length === 0) {
    return (
      <div className="text-center text-sm text-ink-soft py-4">
        아직 고른 질문이 없어요
      </div>
    );
  }

  return (
    <div ref={listRef}>
      {items.map((text, i) => (
        <div
          key={text}
          data-sel-item
          className="flex items-center gap-2.5 bg-paper-card2 border border-black/10 rounded-xl px-2.5 py-2.5 mb-2 last:mb-0 will-change-transform"
          style={{ transition: "transform 220ms cubic-bezier(.2,.8,.2,1)" }}
        >
          <span
            className="text-ink-soft text-lg px-1 cursor-grab touch-none"
            onPointerDown={(e) => {
              const itemEl = e.currentTarget.closest("[data-sel-item]") as HTMLElement;
              startDrag(e, i, itemEl, getSiblings());
              itemEl.style.transition = "none";
              itemEl.style.zIndex = "20";
            }}
            onPointerMove={(e) => {
              const itemEl = e.currentTarget.closest("[data-sel-item]") as HTMLElement;
              moveDrag(e, itemEl, getSiblings());
            }}
            onPointerUp={(e) => {
              const itemEl = e.currentTarget.closest("[data-sel-item]") as HTMLElement;
              itemEl.style.transition = "";
              itemEl.style.zIndex = "";
              endDrag(itemEl, getSiblings());
            }}
          >
            ⠿
          </span>
          <span className="flex-1 text-sm font-bold">{text}</span>
          <button
            aria-label="삭제"
            onClick={() => onRemove(text)}
            className="text-ink-soft text-lg px-1 border-2 border-transparent rounded-lg active:border-accent focus-visible:border-accent"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
