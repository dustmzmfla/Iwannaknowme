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
    // 포인터 캡처는 반드시 실제로 onPointerMove/onPointerUp 리스너가 붙어있는
    // 그 요소(드래그 손잡이 자신, e.currentTarget)에 걸어야 합니다. 예전에는
    // 부모인 itemEl에 캡처를 걸었는데, 캡처가 걸리면 이후 포인터 이벤트의
    // target이 강제로 그 요소로 재지정되기 때문에(스펙상 "retargeted"), 손잡이는
    // itemEl의 자식이라 이벤트가 손잡이까지 내려오지 못하고 move/up 핸들러가
    // 아예 호출되지 않아서 드래그 자체가 동작하지 않는 버그가 있었습니다.
    e.currentTarget.setPointerCapture(e.pointerId);
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
