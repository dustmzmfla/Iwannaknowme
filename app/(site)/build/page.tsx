"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SelectedQuestionList } from "@/components/builder/SelectedQuestionList";
import {
  CATEGORIES,
  MAX_QUESTIONS,
  MIN_QUESTIONS,
  QUESTION_POOL,
  loadQuestionPool,
} from "@/lib/questionPool";
import { readJSON, writeJSON } from "@/lib/storage";
import { useAuth } from "@/lib/auth/AuthProvider";
import { publishQuestionnaire } from "@/lib/creatorFlow";
import type { Category, QuestionPool } from "@/lib/types";

export default function BuildPage() {
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [pool, setPool] = useState<QuestionPool>(QUESTION_POOL);
  const [category, setCategory] = useState<Category>(CATEGORIES[0]);
  const [selected, setSelected] = useState<string[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setSelected(readJSON<string[]>("iwkm_draft_selected", []));
    loadQuestionPool().then(({ categories: c, pool: p }) => {
      setCategories(c);
      setPool(p);
      setCategory((prev) => (c.includes(prev) ? prev : c[0]));
    });
  }, []);

  useEffect(() => {
    writeJSON("iwkm_draft_selected", selected);
  }, [selected]);

  function toggle(q: string) {
    setSelected((prev) => {
      if (prev.includes(q)) return prev.filter((x) => x !== q);
      if (prev.length >= MAX_QUESTIONS) return prev;
      return [...prev, q];
    });
  }

  function reorder(from: number, to: number) {
    setSelected((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  const canProceed = selected.length >= MIN_QUESTIONS;
  const name = authLoading ? "" : profile?.name ?? "친구";
  const questionsInCategory = pool[category] ?? [];

  // 질문을 만드는 사람은 나와의 관계/하고 싶은 말을 적을 필요가 없어서(그건 답변자
  // 몫이에요), 예전처럼 "다음" 눌러서 확인 단계(/build/final)로 보내지 않고 여기서
  // 바로 발행하고 완성 화면(/share/[id])으로 넘어갑니다.
  async function handleNext() {
    if (!canProceed || publishing) return;
    setPublishing(true);
    setError("");
    try {
      const id = await publishQuestionnaire(profile?.name ?? "친구", selected);
      router.push(`/share/${id}`);
    } catch {
      setError("질문지를 발행하지 못했어요. 잠시 후 다시 시도해줘.");
      setPublishing(false);
    }
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/login" />
      <h2 className="font-display text-2xl mb-1.5">{name}님, 궁금한 거 다 골라봐</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        카테고리 뒤져서 궁금한 질문 3~10개 골라봐. &apos;가십&apos;도 있어 👀
      </p>

      <Card>
        <div className="flex items-center justify-between text-[12.5px] font-bold text-ink-soft mb-3">
          <span>카테고리</span>
          <span className="text-accent">
            {selected.length} / {MAX_QUESTIONS}
          </span>
        </div>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3 font-bold mb-3.5 focus:border-accent"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c} ({(pool[c] ?? []).length})
            </option>
          ))}
        </select>

        <div className="grid grid-cols-2 gap-2">
          {questionsInCategory.map((q) => {
            const picked = selected.includes(q);
            const disabled = !picked && selected.length >= MAX_QUESTIONS;
            return (
              <button
                key={q}
                type="button"
                disabled={disabled}
                onClick={() => toggle(q)}
                className={`relative text-left text-[12.6px] leading-snug rounded-xl px-3 py-2.5 border transition disabled:opacity-40 ${
                  picked
                    ? "bg-ink text-paper-card border-ink font-bold"
                    : "bg-paper-card2 border-black/10 hover:border-black/30"
                }`}
              >
                {q}
                {picked && (
                  <span className="absolute top-1.5 right-2 text-highlight text-xs font-bold">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between text-[12.5px] font-bold text-ink-soft mb-3">
          <span>고른 질문</span>
          <span>드래그로 순서 변경</span>
        </div>
        <SelectedQuestionList items={selected} onReorder={reorder} onRemove={toggle} />
      </Card>

      {error && <p className="text-sm text-accent mt-2">{error}</p>}

      <div className="mt-auto pt-5">
        <Button disabled={!canProceed || publishing} onClick={handleNext}>
          {publishing ? "만드는 중..." : "질문지 완성하기"}
        </Button>
      </div>
    </section>
  );
}
