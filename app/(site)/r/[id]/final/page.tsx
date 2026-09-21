"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { readJSON } from "@/lib/storage";
import { submitResponse } from "@/lib/creatorFlow";

const RELATIONS = ["악연", "지인", "친구", "절친", "인연"] as const;

// Next.js 15에서 params가 Promise가 되면서 페이지 컴포넌트 prop으로 직접
// 받으면 "params.id를 React.use()로 풀어써야 한다"는 경고가 뜹니다 — 이 페이지는
// 클라이언트 컴포넌트라 prop 대신 useParams() 훅으로 라우트 파라미터를 읽어서
// 경고 없이 동일하게 동작하도록 했습니다.
export default function RespondentFinalPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [relation, setRelation] = useState<(typeof RELATIONS)[number] | "">("");
  const [finalMessage, setFinalMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!relation) {
      setError("나와의 관계를 선택해줘!");
      return;
    }
    if (!finalMessage.trim()) {
      setError("마지막 한마디는 꼭 남겨줘!");
      return;
    }
    if (submitting) return;
    setSubmitting(true);
    setError("");

    const entry = readJSON<{ nickname: string; duration: string }>(
      `iwkm_entry_${params.id}`,
      { nickname: "", duration: "1년 미만" }
    );
    const answers = readJSON<Record<number, string>>(`iwkm_answers_${params.id}`, {});

    try {
      await submitResponse(params.id, {
        nickname: entry.nickname || null,
        isAnonymous: entry.nickname.length === 0,
        duration: entry.duration,
        relation,
        finalMessage: finalMessage.trim(),
        answers,
        createdAt: new Date().toISOString(),
      });
      router.push(`/r/${params.id}/done`);
    } catch {
      setError("답변을 보내지 못했어. 잠시 후 다시 시도해줘.");
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref={`/r/${params.id}/answer`} />
      <h2 className="font-display text-2xl mb-1.5">마지막 질문이야</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        이 두 개는 필수야. 건너뛸 수 없어!
      </p>

      <div className="mb-4">
        <label className="block text-[13px] text-ink-soft mb-2">
          나와의 관계는 솔직히 어느 정도인 것 같아?
        </label>
        <select
          value={relation}
          onChange={(e) => setRelation(e.target.value as typeof relation)}
          className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3 font-bold focus:border-accent"
        >
          <option value="" disabled>
            선택해줘
          </option>
          {RELATIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>

      <div className="mb-4">
        <label className="block text-[13px] text-ink-soft mb-2">
          마지막으로 나에게 하고 싶은 말
        </label>
        <textarea
          value={finalMessage}
          maxLength={200}
          onChange={(e) => setFinalMessage(e.target.value)}
          placeholder="진심을 담아 써줘"
          className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3 resize-none min-h-[90px] focus:border-accent"
        />
      </div>

      {error && <p className="text-sm text-accent mb-3">{error}</p>}

      <div className="mt-auto pt-5">
        <Button onClick={handleSubmit} disabled={submitting}>
          {submitting ? "보내는 중..." : "답변 보내기"}
        </Button>
      </div>
    </section>
  );
}
