import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-6 pt-4 border-t border-black/10 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1 text-[11px] text-ink-soft">
      <Link href="/about" className="hover:underline">
        서비스 소개
      </Link>
      <span>·</span>
      <Link href="/privacy" className="hover:underline">
        개인정보처리방침
      </Link>
      <span>·</span>
      <Link href="/terms" className="hover:underline">
        이용약관
      </Link>
    </footer>
  );
}
