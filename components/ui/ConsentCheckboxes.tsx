"use client";

import Link from "next/link";

export interface ConsentState {
  termsAgreed: boolean;
  privacyRequiredAgreed: boolean;
  privacyOptionalAgreed: boolean;
}

/**
 * 개인정보보호법 제15조에 따라, 동의를 받을 때는
 * (1) 수집 목적 (2) 수집 항목 (3) 보유 기간 (4) 동의 거부 권리/불이익을 고지해야 합니다.
 * 카카오 등 대형 서비스의 관례처럼 필수/선택 항목을 분리했습니다.
 * ⚠️ 실제 서비스 출시 전 반드시 법률 검토를 받으세요 — 이건 참고용 템플릿입니다.
 */
export function ConsentCheckboxes({
  value,
  onChange,
}: {
  value: ConsentState;
  onChange: (next: ConsentState) => void;
}) {
  const allRequired = value.termsAgreed && value.privacyRequiredAgreed;

  return (
    <div className="space-y-3 text-sm">
      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={value.termsAgreed}
          onChange={(e) => onChange({ ...value, termsAgreed: e.target.checked })}
        />
        <span>
          <b>[필수]</b> 이용약관에 동의합니다.{" "}
          <Link href="/terms" className="underline text-accent">
            보기
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={value.privacyRequiredAgreed}
          onChange={(e) =>
            onChange({ ...value, privacyRequiredAgreed: e.target.checked })
          }
        />
        <span>
          <b>[필수]</b> 개인정보 수집·이용에 동의합니다. (수집 항목: 이름/닉네임,
          카카오 계정 식별자 · 목적: 서비스 제공 및 부정이용 방지 · 보유기간: 회원
          탈퇴 시까지){" "}
          <Link href="/privacy" className="underline text-accent">
            자세히 보기
          </Link>
        </span>
      </label>

      <label className="flex items-start gap-2 cursor-pointer">
        <input
          type="checkbox"
          className="mt-0.5"
          checked={value.privacyOptionalAgreed}
          onChange={(e) =>
            onChange({ ...value, privacyOptionalAgreed: e.target.checked })
          }
        />
        <span>
          <b>[선택]</b> 부가 정보 수집에 동의합니다. 동의하지 않아도
          서비스 이용에는 제한이 없습니다.
        </span>
      </label>

      {!allRequired && (
        <p className="text-xs text-ink-soft">
          필수 항목에 동의해야 다음 단계로 진행할 수 있어요.
        </p>
      )}
    </div>
  );
}

export function isConsentValid(c: ConsentState) {
  return c.termsAgreed && c.privacyRequiredAgreed;
}
