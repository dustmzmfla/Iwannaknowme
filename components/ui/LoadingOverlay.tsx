"use client";

import { useEffect, useState } from "react";

/**
 * 사이트 전체에서 재사용하는 전체화면 로딩 오버레이입니다. 얼굴 형태 없이
 * 눈 두 개만 나와서 "도리도리" 돌아갑니다 — 눈 두 개를 감싼 그룹 전체에
 * perspective + rotateY를 줘서(단순 확대/축소가 아니라) 실제로 입체적으로
 * 돌아가는 것처럼 보이고, 도는 방향으로 위치도 살짝 이동합니다.
 * 아래 문구는 1초마다 점이 0→3개로 늘었다가 다시 0개로 돌아갑니다.
 *
 * 로그인 대기뿐 아니라 화면 전체를 덮어야 하는 로딩 상황이면 어디든
 * `<LoadingOverlay message="..." />` 하나만 렌더링하면 됩니다 — 새 로딩 UI를
 * 만들 필요 없이 이걸 재사용해주세요.
 *
 * 애니메이션에 쓰는 @keyframes(iwkm-face-turn)는 app/globals.css에 있습니다.
 */
export function LoadingOverlay({ message = "두리번두리번 찾는 중" }: { message?: string }) {
  const [dots, setDots] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d + 1) % 4);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-ink/[0.94] backdrop-blur-sm">
      {/* perspective를 여기(부모)에 줘야 아래 눈 그룹의 rotateY가 납작하게 눌리지
          않고 진짜 입체로 돌아가는 것처럼 보입니다. */}
      <div style={{ perspective: "260px" }}>
        <div
          className="flex items-center gap-3"
          style={{ animation: "iwkm-face-turn 2.6s ease-in-out infinite" }}
        >
          <Eye />
          <Eye />
        </div>
      </div>
      <p className="font-display text-lg text-paper-card tracking-wide">
        {message}
        <span className="inline-block w-[1.2em] text-left align-baseline">
          {".".repeat(dots)}
        </span>
      </p>
    </div>
  );
}

function Eye() {
  return (
    <div className="flex h-11 w-9 items-center justify-center rounded-[50%] bg-paper-card shadow-[0_4px_12px_rgba(0,0,0,0.25)]">
      <div className="relative h-3.5 w-3.5 rounded-full bg-ink">
        <span className="absolute left-[3px] top-[3px] h-1 w-1 rounded-full bg-paper-card/80" />
      </div>
    </div>
  );
}
