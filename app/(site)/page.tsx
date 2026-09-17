import Link from "next/link";

export default function IntroPage() {
  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <div className="flex flex-col items-center text-center gap-4 flex-1 justify-center">
        <svg viewBox="0 0 320 210" width={230} height={151} role="img" aria-label="너에게 난. I wanna know me">
          <g transform="rotate(-4 160 105)">
            <rect x="26" y="30" width="268" height="150" rx="16" fill="#FBF4E4" stroke="#3E3226" strokeWidth={3} />
            <rect x="118" y="14" width="86" height="24" fill="#F0C24E" opacity={0.9} transform="rotate(-3 161 26)" />
            <circle cx="54" cy="56" r="7" fill="none" stroke="#3E3226" strokeWidth={3} />
            <text x="160" y="108" textAnchor="middle" fontFamily="var(--font-gaegu)" fontWeight={700} fontSize={42} fill="#3E3226">
              너에게 난?
            </text>
            <text x="160" y="148" textAnchor="middle" fontFamily="var(--font-noto)" fontWeight={700} fontSize={13} letterSpacing={3} fill="#B23A2E">
              I WANNA KNOW ME
            </text>
          </g>
        </svg>
        <p className="text-base font-bold max-w-[280px]">
          친해도 절대 못 물어본 그 질문,
          <br />
          지금 던져봐
        </p>
        <div className="inline-flex flex-col gap-0.5 bg-highlight rounded-2xl px-4 py-2.5 -rotate-2 shadow-[3px_3px_0_rgba(62,50,38,0.15)]">
          <span className="font-display font-bold text-[15px]">⚠ 우정 파손 주의</span>
          <span className="text-[11.5px] font-bold text-[#5A4A16]">
            사이 틀어져도 책임 안 짐 (미리 말해둠)
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-2.5 pt-5">
        <Link
          href="/login"
          className="block w-full text-center font-bold text-[15.5px] py-3.5 rounded-2xl bg-[#FEE500] text-[#391B1B]"
        >
          카카오로 시작하기
        </Link>
        <Link
          href="/r/enter"
          className="block w-full text-center font-bold text-[13px] py-2.5 rounded-xl bg-white border border-black/10"
        >
          이미 링크 받았어? 여기로 ㄱㄱ
        </Link>
      </div>
    </section>
  );
}
