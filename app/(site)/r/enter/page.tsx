"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";

export default function EnterLinkPage() {
  const router = useRouter();
  const [value, setValue] = useState("");

  function handleGo() {
    const trimmed = value.trim();
    if (!trimmed) return;
    // 전체 URL을 붙여넣었을 수도 있으니 마지막 path segment만 추출
    const id = trimmed.split("/").filter(Boolean).pop() ?? trimmed;
    router.push(`/r/${id}`);
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/" />
      <h2 className="font-display text-2xl mb-1.5">링크 붙여넣기</h2>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        받은 공유 링크나 마지막 코드만 붙여넣어줘.
      </p>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="https://.../r/abc123"
        className="w-full bg-white border border-black/15 rounded-xl px-3.5 py-3 mb-4"
      />
      <div className="mt-auto pt-5">
        <Button onClick={handleGo} disabled={!value.trim()}>
          이동하기
        </Button>
      </div>
    </section>
  );
}
