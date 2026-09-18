"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthProvider";
import { hasAnyQuestionnaire } from "@/lib/creatorFlow";
import { LinkAnswerInput } from "@/components/ui/LinkAnswerInput";
import { Footer } from "@/components/ui/Footer";

const CHAT_LINES: { side: "left" | "right"; text: string }[] = [
  { side: "left", text: "너랑 있으면 시간 진짜 잘가" },
  { side: "right", text: "은근 다정한 거 나만 앎 ㅋㅋ" },
  { side: "right", text: "목소리 좋다는 거 알지?" },
  { side: "left", text: "제일 편한 친구야 진짜" },
  { side: "right", text: "리더십 미쳤음 인정" },
  { side: "left", text: "웃음소리 완전 매력적" },
  { side: "left", text: "필요할 때 항상 옆에 있어줌" },
  { side: "right", text: "먼저 연락 잘 해주는 애" },
  { side: "left", text: "은근 럭키비키인듯 ㅋㅋ" },
  { side: "right", text: "성실함 甲 진짜 대단해" },
];
const SLOT_VH = 11; // 말풍선 한 칸의 세로 간격
const SET_TRAVEL = CHAT_LINES.length * SLOT_VH; // 한 세트가 전부 이동하는 거리(vh) — 두 세트를 이어붙여 무한 루프

export default function IntroPage() {
  const router = useRouter();
  const { profile, loading, signOut } = useAuth();
  const [hasQuestion, setHasQuestion] = useState(false);

  useEffect(() => {
    if (!profile) {
      setHasQuestion(false);
      return;
    }
    hasAnyQuestionnaire().then(setHasQuestion);
  }, [profile]);

  const loggedIn = !loading && !!profile;

  async function handleLogout() {
    await signOut();
    router.refresh();
  }

  return (
    <section className="relative isolate flex flex-col flex-1 overflow-hidden">
      <div
        className="absolute inset-0 z-0"
        style={{ background: "linear-gradient(165deg, #F5EFE6 0%, #EFE7DA 55%, #EAE1D2 100%)" }}
      />

      <div className="chat-layer absolute inset-0 z-0 overflow-hidden">
        {[0, 1].map((copy) =>
          CHAT_LINES.map((line, i) => (
            <div
              key={`${copy}-${i}`}
              className={`chat-bubble ${line.side === "left" ? "chat-bubble-left" : "chat-bubble-right"}`}
              style={{ top: `${copy * SET_TRAVEL + i * SLOT_VH + 4}vh` }}
            >
              {line.text}
            </div>
          ))
        )}
      </div>

      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <filter id="lgRefract" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.014" numOctaves={2} seed={7} result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale={22} xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>

      <div className="relative z-10 flex flex-col flex-1 px-[22px] pt-9 pb-6">
        <div className="mb-6">
          <span className="text-[11px] font-bold text-[#7A6A5C] bg-white/55 rounded-lg px-2 py-1">
            나를 알려줘
          </span>
        </div>

        <div className="text-center px-2 mb-8">
          <h1 className="glass-title mb-2.5">
            <span className="text-[#2B2320]">
              <span className="glass-char" style={{ animationDelay: "0s" }}>
                나
              </span>
              <span className="glass-char" style={{ animationDelay: ".06s" }}>
                를
              </span>
            </span>
            <br />
            <span className="text-[#E85D4A]">
              <span className="glass-char" style={{ animationDelay: ".12s" }}>
                알
              </span>
              <span className="glass-char" style={{ animationDelay: ".18s" }}>
                려
              </span>
              <span className="glass-char" style={{ animationDelay: ".24s" }}>
                줘
              </span>
            </span>
          </h1>
          <p className="text-[14px] text-[#5B4C40] leading-relaxed">
            친구들에게 질문을 만들어 보내고,
            <br />
            몰랐던 내 모습을 만나보세요
          </p>
        </div>

        <div className="glass-card relative mt-auto p-[22px] rounded-[32px]">
          <div className="glass-sheen" />
          <div className="glass-edge" />

          {loggedIn ? (
            <div className="relative flex flex-col gap-2.5">
              {hasQuestion && (
                <button onClick={() => router.push("/my/responses")} className="glass-btn-primary">
                  답변보기
                </button>
              )}
              <button
                onClick={() => router.push("/build")}
                className={hasQuestion ? "glass-btn-secondary" : "glass-btn-primary"}
              >
                질문 생성하기
              </button>
              <div className="pt-1.5">
                <p className="text-[12.5px] font-bold text-[#6B5B4D] mb-2">링크로 답변하기</p>
                <LinkAnswerInput />
              </div>
              <div className="flex justify-center pt-1">
                <button
                  onClick={handleLogout}
                  className="text-[16px] font-bold text-[#6B5B4D] underline underline-offset-4 decoration-[#6B5B4D]/50"
                >
                  로그아웃
                </button>
              </div>
            </div>
          ) : (
            <div className="relative flex flex-col gap-2.5">
              <p className="text-[12.5px] font-bold text-[#6B5B4D] mb-0.5">질문 생성하기</p>
              <button onClick={() => router.push("/login")} className="glass-btn-primary">
                카카오로 로그인
              </button>
              <div className="pt-1.5">
                <p className="text-[12.5px] font-bold text-[#6B5B4D] mb-2">이미 링크가 있다면</p>
                <LinkAnswerInput />
              </div>
            </div>
          )}
        </div>

        <Footer />
      </div>

      <style jsx>{`
        .glass-title {
          font-family: var(--font-black-han);
          font-size: 42px;
          line-height: 1.2;
        }
        .glass-char {
          display: inline-block;
          animation: glassBounce 1.7s cubic-bezier(0.34, 1.56, 0.64, 1) infinite;
        }
        @keyframes glassBounce {
          0% {
            transform: translateY(0);
          }
          14% {
            transform: translateY(-16px);
          }
          28% {
            transform: translateY(2px);
          }
          40% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(0);
          }
        }
        .chat-layer {
          filter: blur(3px);
          opacity: 0.55;
        }
        .chat-bubble {
          position: absolute;
          max-width: 210px;
          padding: 10px 14px;
          border-radius: 18px;
          font-size: 12.5px;
          font-weight: 700;
          line-height: 1.4;
          box-shadow: 0 3px 10px rgba(120, 90, 60, 0.1);
          animation: chatMove 18s steps(${CHAT_LINES.length}, end) infinite;
        }
        .chat-bubble-left {
          left: 16px;
          background: #ffffff;
          color: #4a3e34;
          border-bottom-left-radius: 4px;
        }
        .chat-bubble-right {
          right: 16px;
          background: #ffd37a;
          color: #3a2e1e;
          border-bottom-right-radius: 4px;
        }
        @keyframes chatMove {
          0% {
            transform: translateY(0);
          }
          100% {
            transform: translateY(-${SET_TRAVEL}vh);
          }
        }
        .glass-card {
          background: linear-gradient(165deg, rgba(255, 255, 255, 0.24) 0%, rgba(255, 255, 255, 0.08) 100%);
          backdrop-filter: blur(22px) saturate(190%) brightness(1.05) url(#lgRefract);
          -webkit-backdrop-filter: blur(22px) saturate(190%) brightness(1.05);
          border: 1px solid rgba(255, 255, 255, 0.6);
          box-shadow: 0 22px 48px rgba(120, 90, 60, 0.16);
          overflow: hidden;
        }
        .glass-sheen {
          position: absolute;
          inset: 0;
          pointer-events: none;
          mix-blend-mode: overlay;
          background: linear-gradient(
            115deg,
            rgba(255, 255, 255, 0.9) 0%,
            rgba(255, 255, 255, 0.18) 22%,
            rgba(255, 255, 255, 0) 42%,
            rgba(255, 255, 255, 0) 70%,
            rgba(255, 255, 255, 0.4) 100%
          );
        }
        .glass-edge {
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          box-shadow: inset 0 1.5px 0 rgba(255, 255, 255, 1), inset 0 -1.5px 12px rgba(255, 255, 255, 0.4),
            inset 2px 0 0 rgba(255, 255, 255, 0.5), inset -2px 0 0 rgba(120, 90, 60, 0.1),
            inset 0 0 0 1px rgba(255, 255, 255, 0.25);
        }
        .glass-btn-primary {
          position: relative;
          width: 100%;
          padding: 15px 0;
          border: 1px solid rgba(255, 255, 255, 0.65);
          border-radius: 16px;
          background: linear-gradient(180deg, rgba(255, 228, 163, 0.85), rgba(255, 211, 122, 0.85));
          color: #2b2320;
          font-size: 15.5px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(232, 93, 74, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.75);
          transition: transform 0.15s ease;
        }
        .glass-btn-primary:active {
          transform: scale(0.97);
        }
        .glass-btn-secondary {
          position: relative;
          width: 100%;
          padding: 13px 0;
          border: 1px solid rgba(255, 255, 255, 0.55);
          border-radius: 16px;
          background: rgba(255, 255, 255, 0.3);
          color: #2b2320;
          font-size: 14.5px;
          font-weight: 800;
          cursor: pointer;
          transition: transform 0.15s ease;
        }
        .glass-btn-secondary:active {
          transform: scale(0.97);
        }
      `}</style>
    </section>
  );
}
