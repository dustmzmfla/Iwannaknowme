"use client";

import { useEffect, useRef, type TextareaHTMLAttributes } from "react";

/**
 * 내용에 맞춰 높이가 자동으로 늘어나는 textarea입니다. 답변이 길어져도
 * (기본 <input>처럼) 글자가 옆으로 밀려 안 보이게 가려지는 대신, 인풋 자체의
 * 높이가 늘어나서 입력한 내용이 전부 눈에 보이도록 합니다.
 *
 * ref를 직접 넘기진 않지만, value가 바뀔 때마다(타이핑은 물론, localStorage에서
 * 불러온 초기값이 채워질 때도) 높이를 다시 계산합니다.
 */
export function AutoGrowTextarea({
  value,
  className = "",
  rows = 1,
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 한 번 높이를 auto로 리셋해야 내용이 줄어들었을 때(지우기)도 다시
    // 줄어든 scrollHeight를 정확히 잴 수 있습니다.
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      rows={rows}
      className={`resize-none overflow-hidden break-words ${className}`}
      {...rest}
    />
  );
}
