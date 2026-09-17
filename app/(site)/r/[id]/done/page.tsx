export default function DonePage() {
  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px] items-center justify-center text-center gap-4">
      <svg viewBox="0 0 200 160" width={160} height={128}>
        <g transform="rotate(-3 100 80)">
          <rect x="20" y="24" width="160" height="112" rx="16" fill="#FBF4E4" stroke="#3E3226" strokeWidth={3} />
          <text x="100" y="90" textAnchor="middle" fontFamily="var(--font-gaegu)" fontWeight={700} fontSize={30} fill="#B23A2E">
            고마워요
          </text>
        </g>
      </svg>
      <p className="font-bold">
        방금 보낸 답변이 잘 전달됐어요.
        <br />
        솔직하게 답해줘서 고마워요.
      </p>
    </section>
  );
}
