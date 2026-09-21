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
// ⚠️ 이 둘(CHAT_LINES.length, SLOT_VH)은 app/globals.css의 .chat-bubble / @keyframes chatMove에도 값이 박혀있습니다 (스타일드-jsx는 런타임 계산값을 SSR로 적용 못해서 첫 로딩 직후 배경 대화글이 잠깐 그대로 보이는 이슈가 있어서 globals.css로 옮겨놓았습니다). 이 배열을 바꿀거나 SLOT_VH를 바꾸면 globals.css도 같이 고쳐야 합니다.

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
    <section className="relative isolate flex flex-col flex-1 min-h-[100dvh] overflow-hidden">
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

      <div className="relative z-10 flex flex-col flex-1 px-[22px] pt-9 pb-0">
        <div className="flex-1 flex flex-col justify-center">
        <div className="text-center px-2 mb-8">
          <h1 className="glass-title mb-2.5">
            <span className="text-[#2B2320]">
              <span className="glass-char" style={{ animationDelay: "0s" }}>
                내
              </span>
              <span className="glass-char" style={{ animationDelay: ".06s" }}>
                가
              </span>
            </span>
            <br />
            <span className="text-[#E85D4A]">
              <span className="glass-char" style={{ animationDelay: ".12s" }}>
                누
              </span>
              <span className="glass-char" style={{ animationDelay: ".18s" }}>
                구
              </span>
              <span className="glass-char" style={{ animationDelay: ".24s" }}>
                게
              </span>
              <span className="glass-char" style={{ animationDelay: ".3s" }}>
                ?
              </span>
            </span>
          </h1>
          <p className="text-[14px] text-[#5B4C40] leading-relaxed">
            친구들에게 질문을 만들어 보내고,
            <br />
            몰랐던 내 모습을 만나보세요
          </p>
        </div>

        <div className="glass-card relative p-[22px] rounded-[32px]">
          <div className="glass-sheen" />
          <div className="glass-edge" />

          {loggedIn ? (
            <div className="relative flex flex-col gap-2.5">
              {hasQuestion && (
                <button onClick={() => router.push("/my/responses")} className="glass-btn-cta">
                  답변보기
                </button>
              )}
              <button
                onClick={() => router.push("/build")}
                className={hasQuestion ? "glass-btn-secondary" : "glass-btn-cta"}
              >
                새 질문 생성
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
        /* 로그인이 필요한 카카오 버튼 전용입니다 — 카카오 공식 브랜드 색(#FEE500 배경 +
           어두운 글자)을 그대로 써서 눈에 잘 띄고 어떤 서비스로 로그인하는지 바로
           알아볼 수 있게 했습니다. */
        .glass-btn-primary {
          position: relative;
          width: 100%;
          padding: 15px 0;
          border: 1px solid rgba(255, 255, 255, 0.5);
          border-radius: 16px;
          background: #fee500;
          color: #391b1b;
          font-size: 15.5px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(62, 50, 38, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.5);
          transition: transform 0.15s ease;
        }
        .glass-btn-primary:active {
          transform: scale(0.97);
        }
        /* "답변보기" / "새 질문 생성" 처럼 이 카드에서 가장 눈에 띄어야 하는 주요
           버튼입니다. 반투명한 파스텔 배경은 뒤의 흐릿한 대화 말풍선 배경과 섞여서
           잘 안 보였던 문제가 있어, 사이트 포인트 색(accent)을 불투명하게 꽉 채워서
           대비를 확실히 올렸습니다. */
        .glass-btn-cta {
          position: relative;
          width: 100%;
          padding: 15px 0;
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 16px;
          background: #b23a2e;
          color: #fbf4e4;
          font-size: 15.5px;
          font-weight: 800;
          cursor: pointer;
          box-shadow: 0 10px 22px rgba(178, 58, 46, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.2);
          transition: transform 0.15s ease;
        }
        .glass-btn-cta:active {
          transform: scale(0.97);
        }
        .glass-btn-secondary {
          position: relative;
          width: 100%;
          padding: 13px 0;
          border: 1.5px solid #b23a2e;
          border-radius: 16px;
          background: #fbf4e4;
          color: #b23a2e;
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
