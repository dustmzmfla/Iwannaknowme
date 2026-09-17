"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { readJSON } from "@/lib/storage";
import { ANSWER_MAX_LENGTH } from "@/lib/questionPool";

export default function DraftPreviewPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<string[]>([]);

  useEffect(() => {
    setQuestions(readJSON<string[]>("iwkm_draft_selected", []));
  }, []);

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <div className="flex items-center justify-between bg-paper-card2 border border-black/10 rounded-full pl-4 pr-2 py-2 mb-4 text-[12.5px] font-bold">
        <span>👀 미리보기 중이에요</span>
        <button
          onClick={() => router.push("/build/final")}
          className="bg-white border-2 border-transparent rounded-full px-3 py-1.5 text-[11.5px] font-bold active:border-accent"
        >
          종료
        </button>
      </div>

      {questions.map((q, i) => (
        <div key={q} className="mb-5 pb-5 border-b border-black/10 last:border-none">
          <div className="font-display text-lg mb-2.5">{q}</div>
          <input
            type="text"
            maxLength={ANSWER_MAX_LENGTH}
            placeholder="한 줄로 솔직하게"
            className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3"
          />
        </div>
      ))}

      <div className="mt-auto pt-5">
        <Button onClick={() => router.push("/build/final")}>미리보기 종료</Button>
      </div>
    </section>
  );
}
