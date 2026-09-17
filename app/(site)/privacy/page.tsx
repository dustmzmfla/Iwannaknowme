import { BackButton } from "@/components/ui/BackButton";

export default function PrivacyPolicyPage() {
  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px] text-sm leading-relaxed">
      <BackButton fallbackHref="/login" />
      <h1 className="font-display text-2xl mb-4">개인정보처리방침</h1>

      <p className="mb-4 text-ink-soft">
        ⚠️ 아래 내용은 개인정보보호법 제15조가 요구하는 고지 항목(수집 목적, 수집
        항목, 보유기간, 동의 거부 권리)을 반영한 <b>템플릿</b>입니다. 실제 서비스
        출시 전에는 반드시 변호사 또는 개인정보보호위원회 자료로 최종 검토하세요.
      </p>

      <h2 className="font-bold mt-5 mb-2">1. 수집하는 개인정보 항목</h2>
      <table className="w-full text-xs border-collapse mb-2">
        <thead>
          <tr className="border-b border-black/20">
            <th className="text-left py-1.5">구분</th>
            <th className="text-left py-1.5">항목</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-black/10">
            <td className="py-1.5 font-bold">필수</td>
            <td className="py-1.5">이름(또는 닉네임), 카카오 계정 고유 식별자</td>
          </tr>
          <tr>
            <td className="py-1.5 font-bold">선택</td>
            <td className="py-1.5">생년월일</td>
          </tr>
        </tbody>
      </table>

      <h2 className="font-bold mt-5 mb-2">2. 수집 목적</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>회원 식별 및 서비스 제공 (질문지 생성·관리)</li>
        <li>부정 이용 방지 및 이용자 문의 응대</li>
        <li>(선택 항목) 서비스 개선을 위한 통계 분석</li>
      </ul>

      <h2 className="font-bold mt-5 mb-2">3. 보유 및 이용 기간</h2>
      <p>회원 탈퇴 시까지 보유하며, 탈퇴 즉시 파기합니다. (법령에 따라 별도 보관이 필요한 경우 제외)</p>

      <h2 className="font-bold mt-5 mb-2">4. 동의를 거부할 권리 및 불이익</h2>
      <p>
        필수 항목 동의를 거부하시면 서비스 이용(질문지 생성)이 불가능합니다. 선택
        항목 동의를 거부하셔도 서비스 이용에는 제한이 없습니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">5. 답변자(응답자) 정보 처리</h2>
      <p>
        답변자는 별도 로그인 없이 닉네임(선택)과 답변 내용을 제출합니다. 닉네임을
        입력하지 않으면 익명으로 처리되며, 별도 식별 정보를 수집하지 않습니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">6. 이용자의 권리</h2>
      <p>
        이용자는 언제든지 자신의 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수
        있습니다. 답변 삭제 요청 시 이용자 화면에서는 즉시 숨김 처리되며, 서비스
        운영자는 남용 방지를 위해 일정 기간 내부적으로 보관 후 영구 삭제합니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">7. 개인정보 보호책임자</h2>
      <p>담당자: (서비스 운영자 이름) / 이메일: (연락처 입력)</p>
    </section>
  );
}
