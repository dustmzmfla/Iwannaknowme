"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** 홈 화면의 "이미 링크가 있다면 / 링크로 답변하기" 인라인 입력창.
 * 전체 URL이나 마지막 코드만 붙여넣어도 /r/[id]로 이동합니다. */
export function LinkAnswerInput({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [value, setValue] = useState("");

  function go() {
    const trimmed = value.trim();
    if (!trimmed) return;
    const id = trimmed.split("/").filter(Boolean).pop() ?? trimmed;
    router.push(`/r/${id}`);
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") go();
        }}
        placeholder="https://.../r/abc123"
        className="flex-1 min-w-0 bg-white/45 border border-white/60 rounded-xl px-3.5 py-3 text-[13.5px] text-[#2B2320] placeholder:text-[#6B5B4D]/60 backdrop-blur-sm"
      />
      <button
        onClick={go}
        disabled={!value.trim()}
        aria-label="이동하기"
        className={`shrink-0 w-11 h-11 rounded-xl border flex items-center justify-center font-bold active:scale-95 transition ${
          value.trim()
            ? "bg-accent border-accent text-paper-card"
            : "bg-white/55 border-white/60 text-[#2B2320] opacity-40"
        }`}
      >
        →
      </button>
    </div>
  );
}
