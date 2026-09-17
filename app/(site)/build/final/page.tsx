"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { StepBar } from "@/components/ui/StepBar";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { readJSON } from "@/lib/storage";
import { publishQuestionnaire } from "@/lib/creatorFlow";
import { MIN_QUESTIONS } from "@/lib/questionPool";

export default function FinalSetupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    setName(readJSON("iwkm_draft_name", "친구"));
    setSelected(readJSON<string[]>("iwkm_draft_selected", []));
  }, []);

  function handlePreview() {
    // 미리보기는 아직 발행되지 않은 상태이므로 draft 그대로 답변 화면에 넘겨서 보여줍니다.
    router.push("/build/preview");
  }

  function handlePublish() {
    if (selected.length < MIN_QUESTIONS) return;
    const id = publishQuestionnaire(name, selected);
    router.push(`/share/${id}`);
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/build" />
      <StepBar step={3} />
      <h2 className="font-display text-2xl mb-1.5">이건 국룰이라 다 붙어</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        답변자한테는 이 두 질문이 자동으로 마지막에 나가. 절대 못 건너뛰어 — 직접
        눌러봐도 돼.
      </p>

      <Card>
        <div className="text-[12.5px] font-bold text-ink-soft mb-3">필수 질문 ①</div>
        <label className="block text-[13px] text-ink-soft mb-2">
          나와의 관계는 솔직히 어느 정도인 것 같아?
        </label>
        <select className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3 font-bold">
          <option value="" disabled>
            선택해줘
          </option>
          <option>악연</option>
          <option>지인</option>
          <option>친구</option>
          <option>인연</option>
        </select>
      </Card>

      <Card>
        <div className="text-[12.5px] font-bold text-ink-soft mb-3">필수 질문 ②</div>
        <label className="block text-[13px] text-ink-soft mb-2">
          마지막으로 나에게 하고 싶은 말
        </label>
        <textarea
          placeholder="진심을 담아 써줘"
          className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3 resize-none min-h-[90px]"
        />
      </Card>

      <Button variant="ghost" onClick={handlePreview}>
        질문 미리보기 (친구 눈으로 보기)
      </Button>

      <div className="mt-auto pt-5">
        <Button onClick={handlePublish} disabled={selected.length < MIN_QUESTIONS}>
          질문지 완성하기
        </Button>
      </div>
    </section>
  );
}
