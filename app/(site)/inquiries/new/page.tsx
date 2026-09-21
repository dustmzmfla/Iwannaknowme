"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { createInquiry } from "@/lib/inquiries";

export default function NewInquiryPage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSecret, setIsSecret] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 모두 입력해줘.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const id = await createInquiry({ title: title.trim(), content: content.trim(), isSecret });
      router.push(`/inquiries/${id}`);
    } catch {
      setError("등록하지 못했어요. 잠시 후 다시 시도해줘.");
      setSubmitting(false);
    }
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton />

      <h2 className="font-display text-2xl mb-1.5">문의 작성</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        궁금한 점이나 불편했던 점을 편하게 남겨줘.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목"
          maxLength={80}
          className="border border-black/15 rounded-xl px-3.5 py-3 text-sm bg-white"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="내용을 자세히 적어줄수록 빠르게 답변할 수 있어요."
          rows={8}
          className="border border-black/15 rounded-xl px-3.5 py-3 text-sm bg-white resize-none leading-relaxed"
        />

        <label className="flex items-center gap-2 text-sm text-ink-soft select-none">
          <input
            type="checkbox"
            checked={isSecret}
            onChange={(e) => setIsSecret(e.target.checked)}
            className="w-4 h-4 accent-accent"
          />
          🔒 비밀글로 작성 (작성자 본인과 관리자만 볼 수 있어요)
        </label>

        {error && <p className="text-xs text-accent font-bold">{error}</p>}

        <Button type="submit" disabled={submitting} className="mt-2">
          {submitting ? "등록 중..." : "등록하기"}
        </Button>
      </form>
    </section>
  );
}
