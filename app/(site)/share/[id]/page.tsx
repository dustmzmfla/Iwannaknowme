"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { getQuestionnaire, listResponses } from "@/lib/creatorFlow";

export default function SharePage({ params }: { params: { id: string } }) {
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [responseCount, setResponseCount] = useState(0);

  useEffect(() => {
    setLink(`${window.location.origin}/r/${params.id}`);
    setResponseCount(listResponses(params.id).length);
  }, [params.id]);

  const questionnaire = getQuestionnaire(params.id);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      // 클립보드 권한이 없는 브라우저 대비
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/build/final" />
      <h2 className="font-display text-2xl mb-1.5">짜잔, 완성!</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        이 링크 뿌리고 반응 기다려보자. 답변은 익명으로도, 이름 걸고도 받을 수 있어.
      </p>

      <div className="relative bg-paper-card border border-black/10 rounded-2xl p-[22px] mb-4 -rotate-1 overflow-hidden">
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 -rotate-2 w-[90px] h-[22px] bg-highlight opacity-85" />
        <div className="text-xs text-ink-soft mt-1.5 mb-2">공유 링크</div>
        <div className="text-[13px] font-bold break-all">{link}</div>
      </div>

      <Button onClick={handleCopy}>{copied ? "복사됐어요!" : "링크 복사하기"}</Button>
      <div className="h-2.5" />
      <Link
        href={`/r/${params.id}`}
        className="block w-full text-center font-bold text-[15.5px] py-3.5 rounded-2xl bg-white border border-black/10"
      >
        친구 눈으로 미리보기
      </Link>

      <div className="mt-auto flex flex-col gap-2.5 pt-5">
        <Link
          href="/build"
          className="block w-full text-center font-bold text-[13px] py-2.5 rounded-xl bg-white border border-black/10"
        >
          질문 다시 고르기
        </Link>
        <p className="text-center text-xs text-ink-soft">
          지금까지 {responseCount}명이 답변했어요 (데모: 새로고침 필요할 수 있음)
        </p>
      </div>
      {!questionnaire && (
        <p className="text-center text-xs text-accent mt-3">
          질문지를 찾을 수 없어요. 다시 만들어봐 주세요.
        </p>
      )}
    </section>
  );
}
