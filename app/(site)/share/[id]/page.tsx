"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { getQuestionnaire, listResponses, type PublishedQuestionnaire } from "@/lib/creatorFlow";

// Next.js 15에서 params가 Promise가 되면서 페이지 컴포넌트 prop으로 직접
// 받으면 "params.id를 React.use()로 풀어써야 한다"는 경고가 뜹니다 — 이 페이지는
// 클라이언트 컴포넌트라 prop 대신 useParams() 훅으로 라우트 파라미터를 읽어서
// 경고 없이 동일하게 동작하도록 했습니다.
export default function SharePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();
  const [link, setLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [responseCount, setResponseCount] = useState(0);
  const [questionnaire, setQuestionnaire] = useState<PublishedQuestionnaire | null | undefined>(
    undefined
  );

  useEffect(() => {
    setLink(`${window.location.origin}/r/${params.id}`);
    listResponses(params.id).then((list) => setResponseCount(list.length));
    getQuestionnaire(params.id).then(setQuestionnaire);
  }, [params.id]);

  // 이 화면엔 뒤로가기 버튼을 아예 없앴지만, 폰의 제스처/물리 뒤로가기는 막을 수
  // 없어요. 그래서 대신 감지합니다 — 뒤로 가려는 시도가 오면 더미 히스토리를 다시
  // 쌓아서 실제로는 이 페이지에 머무르게 하고, "이미 생성된 질문입니다." 토스트를
  // 띄웁니다. 토스트의 onDismiss는 3초 뒤 자동으로 꺼지든, 토스트나 배경을 눌러서
  // 바로 꺼지든 상관없이 그 순간 딱 한 번 불리기 때문에, 메인 화면 이동은 여기
  // 한 곳에만 적어두면 됩니다.
  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    function handlePopState() {
      window.history.pushState(null, "", window.location.href);
      showToast("이미 생성된 질문입니다.", () => {
        router.replace("/");
      });
    }

    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className="mt-auto flex flex-col gap-2.5 pt-5">
        <Link
          href="/"
          className="block w-full text-center font-bold text-[13px] py-2.5 rounded-xl bg-white border border-black/10"
        >
          메인 페이지로
        </Link>
        <p className="text-center text-xs text-ink-soft">지금까지 {responseCount}명이 답변했어요</p>
      </div>
      {questionnaire === null && (
        <p className="text-center text-xs text-accent mt-3">
          질문지를 찾을 수 없어요. 다시 만들어봐 주세요.
        </p>
      )}
    </section>
  );
}
