import { BackButton } from "@/components/ui/BackButton";

export default function AboutPage() {
  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px] text-sm leading-relaxed">
      <BackButton fallbackHref="/" />
      <h1 className="font-display text-2xl mb-4">나를 알려줘 서비스 소개</h1>

      <p className="mb-4">
        &lsquo;나를 알려줘&rsquo;는 친구, 지인, 연인처럼 가까운 사이에서도 막상
        얼굴 보고는 묻기 어려운 질문들을 익명(또는 닉네임)으로 주고받을 수 있게
        해주는 질문지 서비스입니다. 질문을 만든 사람이 카카오 계정으로 로그인해
        궁금한 질문을 3~10개 고르고, 생성된 링크를 지인에게 공유하면, 링크를
        받은 사람이 로그인 없이 바로 답변을 남길 수 있습니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">이렇게 사용해요</h2>
      <ol className="list-decimal pl-5 space-y-1.5">
        <li>카카오 계정으로 로그인합니다 (별도 회원가입 절차가 없어요).</li>
        <li>외모·패션·성격·관계·추억·가십 등 카테고리에서 궁금한 질문을 3~10개 고릅니다.</li>
        <li>완성된 질문지의 공유 링크를 친구에게 보냅니다.</li>
        <li>
          친구는 로그인 없이 링크에 들어와 닉네임(선택)과 함께 솔직한 답변을
          남깁니다.
        </li>
        <li>내 계정으로 돌아와 &lsquo;받은 답변 보기&rsquo;에서 답변을 확인합니다.</li>
      </ol>

      <h2 className="font-bold mt-5 mb-2">질문지는 한 번 만들면 수정하지 않아요</h2>
      <p>
        이미 답변이 달리기 시작한 질문지를 나중에 고치면, 답변자가 어떤 질문에
        답했는지가 서로 어긋나 버립니다. 그래서 발행된 질문지의 질문 목록은 의도적으로
        수정할 수 없게 만들었어요. 다른 질문으로 다시 받고 싶다면 새 질문지를
        만들면 됩니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">콘텐츠 운영 원칙</h2>
      <p>
        욕설, 명예훼손, 성적 수치심을 유발하는 답변 등 부적절한 내용이 발견되면
        운영자가 관리자 페이지를 통해 해당 답변을 숨기거나 영구 삭제할 수 있으며,
        모든 조치는 관리자 활동 로그로 기록됩니다. 이용자는 본인이 받은 답변을
        언제든 자신의 화면에서 숨길 수 있습니다.
      </p>

      <h2 className="font-bold mt-5 mb-2">운영자 정보 / 문의</h2>
      <p>
        서비스 운영자: (운영자 이름을 입력하세요) · 문의: (연락처 이메일을
        입력하세요)
      </p>
    </section>
  );
}
