"use client";

import { useRef, type PointerEvent } from "react";

/**
 * 이전 vanilla-JS 프로토타입의 포인터 드래그 정렬 로직을 React 훅으로 이식했습니다.
 * 사용법: 리스트의 각 항목에 handleRef와 itemRef를 연결하고,
 * onReorder(fromIndex, toIndex)를 호출하면 부모가 실제 배열 순서를 바꿉니다.
 */
export function useDragReorder<T>(
  items: T[],
  onReorder: (from: number, to: number) => void
) {
  const dragState = useRef<{
    index: number;
    insertIndex: number;
    startY: number;
    height: number;
    midpoints: { index: number; mid: number }[];
  } | null>(null);

  function startDrag(
    e: PointerEvent<HTMLElement>,
    index: number,
    itemEl: HTMLElement,
    siblingEls: HTMLElement[]
  ) {
    e.preventDefault();
    const rect = itemEl.getBoundingClientRect();
    const midpoints = siblingEls
      .map((el, i) => ({ el, i }))
      .filter(({ i }) => i !== index)
      .map(({ el, i }) => {
        const r = el.getBoundingClientRect();
        return { index: i, mid: r.top + r.height / 2 };
      });

    dragState.current = {
      index,
      insertIndex: index,
      startY: e.clientY,
      height: rect.height + 8,
      midpoints,
    };
    itemEl.setPointerCapture(e.pointerId);
  }

  function moveDrag(
    e: PointerEvent<HTMLElement>,
    itemEl: HTMLElement,
    siblingEls: HTMLElement[]
  ) {
    const state = dragState.current;
    if (!state) return;
    const deltaY = e.clientY - state.startY;
    itemEl.style.transform = `translateY(${deltaY}px)`;

    const countBefore = state.midpoints.filter((m) => m.mid < e.clientY).length;
    if (countBefore !== state.insertIndex) {
      state.insertIndex = countBefore;
      siblingEls.forEach((el, idx) => {
        if (idx === state.index) return;
        let shift = 0;
        if (state.index < state.insertIndex) {
          if (idx > state.index && idx <= state.insertIndex) shift = -state.height;
        } else if (state.index > state.insertIndex) {
          if (idx >= state.insertIndex && idx < state.index) shift = state.height;
        }
        el.style.transform = `translateY(${shift}px)`;
      });
    }
  }

  function endDrag(itemEl: HTMLElement, siblingEls: HTMLElement[]) {
    const state = dragState.current;
    if (!state) return;
    siblingEls.forEach((el) => {
      el.style.transform = "";
    });
    itemEl.style.transform = "";
    if (state.insertIndex !== state.index) {
      onReorder(state.index, state.insertIndex);
    }
    dragState.current = null;
  }

  return { startDrag, moveDrag, endDrag };
}
