"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { getQuestionnaire, hasResponded, type PublishedQuestionnaire } from "@/lib/creatorFlow";
import { writeJSON } from "@/lib/storage";
import { useAuth } from "@/lib/auth/AuthProvider";

const DURATIONS = ["1년 미만", "1년", "2년", "3년", "4년", "5년 이상"];

// Next.js 15에서 params가 Promise가 되면서 페이지 컴포넌트 prop으로 직접
// 받으면 "params.id를 React.use()로 풀어써야 한다"는 경고가 뜹니다 — 이 페이지는
// 클라이언트 컴포넌트라 prop 대신 useParams() 훅으로 라우트 파라미터를 읽어서
// 경고 없이 동일하게 동작하도록 했습니다.
export default function RespondentEntryPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, loading: authLoading } = useAuth();
  const [questionnaire, setQuestionnaire] = useState<PublishedQuestionnaire | null | undefined>(
    undefined
  );
  const [nickname, setNickname] = useState("");
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [answered, setAnswered] = useState(false);

  useEffect(() => {
    writeJSON(`iwkm_entry_${params.id}`, { nickname: "", duration: DURATIONS[0] });
    getQuestionnaire(params.id).then((q) => {
      setQuestionnaire(q);
      if (q) hasResponded(params.id).then(setAnswered);
    });
  }, [params.id]);

  // 질문지를 만든 본인이 자기 링크로 들어온 경우 - 답변을 작성하는 대신 받은
  // 답변을 보는 화면으로 보냅니다 (로그인/질문지 조회가 둘 다 끝난 뒤에 판단).
  const isOwnLink = !authLoading && !!profile && !!questionnaire && questionnaire.ownerId === profile.id;

  useEffect(() => {
    if (isOwnLink) router.replace("/my/responses");
  }, [isOwnLink, router]);

  if (questionnaire === undefined || authLoading || isOwnLink) {
    return (
      <section className="flex flex-col flex-1 px-[22px] py-[26px] items-center justify-center">
        <p className="text-ink-soft text-sm">불러오는 중...</p>
      </section>
    );
  }

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

  if (answered) {
    return (
      <section className="flex flex-col flex-1 px-[22px] py-[26px]">
        <BackButton fallbackHref="/" />
        <h2 className="font-display text-2xl mb-1.5">이미 답변하셨습니다</h2>
        <p className="text-[13.5px] text-ink-soft leading-relaxed">
          이 링크로는 이미 답변을 보냈어. 같은 사람이 여러 번 답변하지 못하도록
          하나의 링크당 한 번만 참여할 수 있어.
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
        <span className="font-display font-bold">내가 누구게?</span>
      </div>

      <h2 className="font-display text-2xl mb-1.5">{questionnaire.creatorName}에 대해 알려줄 준비가 됐어?</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        네 답변이 도움이 될 수 있게 귀찮겠지만 정성스럽게 작성해주면 좋겠어!
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
          placeholder=""
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
