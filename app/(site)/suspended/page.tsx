import { BackButton } from "@/components/ui/BackButton";

export default function SuspendedPage() {
  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px] items-center justify-center text-center">
      <BackButton fallbackHref="/" />
      <h1 className="font-display text-2xl mb-3">이용이 제한된 계정이에요</h1>
      <p className="text-sm text-ink-soft leading-relaxed max-w-[280px]">
        이 계정은 서비스 이용이 정지되어 로그인이 제한됩니다.
        <br />
        문의사항이 있다면 문의하기를 통해 알려주세요.
      </p>
    </section>
  );
}
