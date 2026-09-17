import { BackButton } from "@/components/ui/BackButton";

export default function TermsPage() {
  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px] text-sm leading-relaxed">
      <BackButton fallbackHref="/login" />
      <h1 className="font-display text-2xl mb-4">이용약관 (초안)</h1>
      <p className="text-ink-soft">
        실제 서비스 출시 전 채워야 할 표준 이용약관 자리입니다. 서비스 목적, 이용자
        의무(타인 비방·명예훼손 콘텐츠 금지 등), 게시물 관리 및 삭제 정책, 책임
        제한, 분쟁 해결 절차 등을 포함해 법률 검토 후 작성하세요.
      </p>
    </section>
  );
}
