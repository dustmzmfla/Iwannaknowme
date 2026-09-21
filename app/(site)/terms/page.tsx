import { BackButton } from "@/components/ui/BackButton";

export default function TermsPage() {
  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px] text-sm leading-relaxed">
      <BackButton fallbackHref="/login" />
      <h1 className="font-display text-2xl mb-4">이용약관</h1>
      <h2 className="font-bold mt-5 mb-2">제1조 (목적)</h2>
      <p>
        이 약관은 &lsquo;내가 누구게?&rsquo;(이하 &lsquo;서비스&rsquo;)이 제공하는
        익명 질문지 서비스의 이용조건 및 절차, 이용자와 서비스 운영자의 권리·의무
        및 책임사항을 규정함을 목적으로 합니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">제2조 (서비스 이용)</h2>
      <p>
        이용자는 카카오 계정을 통한 로그인으로 질문지를 생성할 수 있으며, 답변자는
        별도 로그인 없이 공유받은 링크를 통해 답변을 제출할 수 있습니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">제3조 (이용자의 의무 — 금지행위)</h2>
      <p className="mb-2">이용자(질문 작성자·답변자 모두)는 다음 행위를 해서는 안 됩니다.</p>
      <ul className="list-disc pl-5 space-y-1">
        <li>타인을 비방하거나 명예를 훼손하는 내용을 작성하는 행위</li>
        <li>욕설, 혐오 표현, 성적 수치심을 유발하는 내용을 작성하는 행위</li>
        <li>타인의 개인정보를 본인 동의 없이 게시하는 행위</li>
        <li>서비스를 이용해 불법적인 목적을 달성하려는 행위</li>
        <li>광고성 정보를 무단으로 게시하거나 서비스를 스팸 목적으로 이용하는 행위</li>
      </ul>

      <h2 className="font-bold mt-5 mb-2">제4조 (게시물 관리 및 삭제)</h2>
      <p>
        운영자는 제3조를 위반하거나 신고가 접수된 답변을 확인 후 사전 통지 없이
        숨김 또는 영구 삭제할 수 있으며, 관련 조치 내역은 관리자 활동 로그로
        기록·보관합니다. 이용자 본인은 자신이 받은 답변을 언제든 자신의 화면에서
        숨길 수 있습니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">제5조 (질문지 수정 제한)</h2>
      <p>
        발행된 질문지의 질문 목록은 답변과의 정합성을 위해 발행 이후 수정할 수
        없습니다. 다른 질문으로 답변을 받고 싶다면 새 질문지를 생성해야 합니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">제6조 (서비스의 책임 제한)</h2>
      <p>
        운영자는 이용자가 작성·게시한 콘텐츠의 내용에 대해 사전 검열하지 않으며,
        이용자 간에 발생한 분쟁에 대해 원칙적으로 개입하지 않습니다. 다만 명백한
        약관 위반이 확인되는 경우 제4조에 따라 조치할 수 있습니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">제7조 (계정 탈퇴)</h2>
      <p>
        이용자는 메뉴의 &lsquo;계정 삭제&rsquo;를 통해 언제든지 탈퇴할 수 있으며,
        탈퇴 시 작성한 질문지와 받은 답변을 포함한 개인정보는 개인정보처리방침에
        따라 처리됩니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">제8조 (분쟁 해결)</h2>
      <p>
        이 약관과 관련하여 분쟁이 발생할 경우, 이용자와 운영자는 대한민국 법령을
        준거법으로 하여 상호 협의하여 해결하며, 협의가 되지 않을 경우 관련 법령에
        따른 관할 법원에 제소할 수 있습니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">제9조 (사업자 정보)</h2>
      <p>
        상호: 해누소프트웨어 · 대표: 스해누 · 사업자등록번호: 111-37-34863 ·
        이메일: haenooss@gmail.com
      </p>
    </section>
  );
}
