"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { getQuestionnaire } from "@/lib/creatorFlow";
import { writeJSON } from "@/lib/storage";

const DURATIONS = ["1년 미만", "1년", "2년", "3년", "4년", "5년 이상"];

export default function RespondentEntryPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const questionnaire = getQuestionnaire(params.id);
  const [nickname, setNickname] = useState("");
  const [duration, setDuration] = useState(DURATIONS[0]);

  useEffect(() => {
    writeJSON(`iwkm_entry_${params.id}`, { nickname: "", duration: DURATIONS[0] });
  }, [params.id]);

  if (!questionnaire) {
    return (
      <section className="flex flex-col flex-1 px-[22px] py-[26px]">
        <BackButton fallbackHref="/" />
        <h2 className="font-display text-2xl mb-1.5">링크를 못 찾겠어</h2>
        <p className="text-[13.5px] text-ink-soft leading-relaxed">
          링크가 만료됐거나 잘못됐나 봐. 질문지 만든 사람한테 다시 확인해봐.
        </p>
      </section>
    );
  }

  function handleStart() {
    writeJSON(`iwkm_entry_${params.id}`, { nickname: nickname.trim(), duration });
    router.push(`/r/${params.id}/answer`);
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/" />
      <div className="flex items-center gap-2 mb-5">
        <svg viewBox="0 0 40 40" width={30} height={30}>
          <rect x="2" y="2" width="36" height="36" rx="10" fill="#FBF4E4" stroke="#3E3226" strokeWidth={2.5} />
          <text x="20" y="26" textAnchor="middle" fontFamily="var(--font-gaegu)" fontWeight={700} fontSize={16} fill="#3E3226">
            난?
          </text>
        </svg>
        <span className="font-display font-bold">나를 알려줘</span>
      </div>

      <h2 className="font-display text-2xl mb-1.5">{questionnaire.creatorName}가 너를 저격했어</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        솔직하게 답해줘. 다 너 좋으라고 이러는 거야 (아마도).
      </p>

      <div className="mb-4">
        <label className="block text-[13px] text-ink-soft mb-2">
          닉네임 (선택, 비워두면 익명으로 전달돼요)
        </label>
        <input
          type="text"
          value={nickname}
          maxLength={12}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="예) 민지 또는 비워두기"
          className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3 focus:border-accent"
        />
      </div>

      <div className="mb-4">
        <label className="block text-[13px] text-ink-soft mb-2">알고 지낸 기간</label>
        <select
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3 font-bold"
        >
          {DURATIONS.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="mt-auto pt-5">
        <Button onClick={handleStart}>답변 시작하기</Button>
      </div>
    </section>
  );
}
