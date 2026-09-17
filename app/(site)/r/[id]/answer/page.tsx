"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { getQuestionnaire, type PublishedQuestionnaire } from "@/lib/creatorFlow";
import { readJSON, writeJSON } from "@/lib/storage";
import { ANSWER_MAX_LENGTH } from "@/lib/questionPool";

export default function AnswerPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [questionnaire, setQuestionnaire] = useState<PublishedQuestionnaire | null | undefined>(
    undefined
  );
  const [answers, setAnswers] = useState<Record<number, string>>({});

  useEffect(() => {
    setAnswers(readJSON<Record<number, string>>(`iwkm_answers_${params.id}`, {}));
    getQuestionnaire(params.id).then(setQuestionnaire);
  }, [params.id]);

  if (!questionnaire) return null;

  function updateAnswer(i: number, value: string) {
    const next = { ...answers, [i]: value.slice(0, ANSWER_MAX_LENGTH) };
    setAnswers(next);
    writeJSON(`iwkm_answers_${params.id}`, next);
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref={`/r/${params.id}`} />
      <div className="bg-paper-card2 border border-black/10 rounded-xl text-center text-[12.5px] font-medium text-ink-soft py-2.5 px-3 mb-4">
        한 줄로 톡 쏘게! (최대 {ANSWER_MAX_LENGTH}자, 비워둬도 OK)
      </div>

      {questionnaire.questions.map((q, i) => (
        <div key={i} className="mb-5 pb-5 border-b border-black/10 last:border-none">
          <div className="font-display text-lg mb-2.5">{q}</div>
          <input
            type="text"
            value={answers[i] ?? ""}
            maxLength={ANSWER_MAX_LENGTH}
            onChange={(e) => updateAnswer(i, e.target.value)}
            placeholder="한 줄로 솔직하게"
            className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3 focus:border-accent"
          />
          <span className="block text-right text-[11px] font-bold text-ink-soft mt-1">
            {(answers[i] ?? "").length}/{ANSWER_MAX_LENGTH}
          </span>
        </div>
      ))}

      <div className="mt-auto pt-5">
        <Button onClick={() => router.push(`/r/${params.id}/final`)}>다음</Button>
      </div>
    </section>
  );
}
