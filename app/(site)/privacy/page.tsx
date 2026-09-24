import { BackButton } from "@/components/ui/BackButton";

export default function PrivacyPolicyPage() {
  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px] text-sm leading-relaxed">
      <BackButton fallbackHref="/login" />
      <h1 className="font-display text-2xl mb-4">개인정보처리방침</h1>

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
            <td className="py-1.5">
              카카오 계정 고유 식별자, 닉네임(프로필명), 프로필 사진 URL
            </td>
          </tr>
        </tbody>
      </table>
      <p className="text-xs text-ink-soft mb-2">
        카카오 로그인(소셜 로그인)을 통해 위 정보를 카카오로부터 전달받습니다.
        비밀번호는 저장하지 않습니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">2. 수집 목적</h2>
      <ul className="list-disc pl-5 space-y-1">
        <li>회원 식별 및 서비스 제공 (질문지 생성·관리, 로그인 유지)</li>
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

      <h2 className="font-bold mt-5 mb-2">6. 광고 서비스(Google AdSense) 및 쿠키</h2>
      <p className="mb-2">
        이 사이트는 Google AdSense를 통해 광고를 게재할 수 있습니다. Google을
        포함한 제3자 광고 파트너는 쿠키(예: Google의 DART 쿠키)를 사용해 이용자의
        이전 방문 기록을 바탕으로 광고를 게재할 수 있습니다.
      </p>
      <ul className="list-disc pl-5 space-y-1">
        <li>
          Google의 광고 쿠키 사용에 대해서는{" "}
          <a
            href="https://policies.google.com/technologies/ads"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline"
          >
            Google 광고 정책
          </a>
          에서 확인할 수 있습니다.
        </li>
        <li>
          맞춤 광고를 원하지 않는 경우{" "}
          <a
            href="https://adssettings.google.com/"
            target="_blank"
            rel="noreferrer"
            className="text-accent underline"
          >
            Google 광고 설정
          </a>
          에서 개인 맞춤 광고를 비활성화할 수 있습니다.
        </li>
      </ul>

      <h2 className="font-bold mt-5 mb-2">7. 이용자의 권리</h2>
      <p>
        이용자는 언제든지 자신의 개인정보 열람, 정정, 삭제, 처리정지를 요청할 수
        있습니다. 답변 삭제 요청 시 이용자 화면에서는 즉시 숨김 처리되며, 서비스
        운영자는 남용 방지를 위해 일정 기간 내부적으로 보관 후 영구 삭제합니다.
        계정 자체는 메뉴의 &lsquo;계정 삭제&rsquo;를 통해 즉시 탈퇴 및 개인정보
        파기를 요청할 수 있습니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">8. 개인정보 보호책임자</h2>
      <p>
        담당자: 서현우 (해누소프트웨어, 사업자등록번호 111-37-34863) / 이메일:{" "}
        haenooss@gmail.com
      </p>
      <p className="text-xs text-ink-soft mt-1">
        개인정보 관련 문의·열람·정정·삭제 요청은 위 이메일로 접수해 주세요.
      </p>

      <h2 className="font-bold mt-5 mb-2">9. 고지의 의무</h2>
      <p>이 개인정보처리방침은 최초 공개일부터 적용되며, 내용 추가·삭제 및 수정이 있을 시 시행일 최소 7일 전부터 공지사항을 통해 고지할 것입니다.</p>
    </section>
  );
}
