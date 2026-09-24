// Next.js는 서버에서도 컴포넌트를 렌더링하므로 localStorage 접근은 항상 가드가 필요합니다.
export function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

const RESPONDENT_TOKEN_KEY = "iwkm_respondent_token";

/** 답변자를 식별할 브라우저 단위 익명 토큰입니다. 로그인 없이도 "같은 사람이
 * 같은 링크로 두 번 답변하는 것"을 막는 데 씁니다. 최초 호출 시 한 번 생성해서
 * localStorage에 저장하고, 이후에는 계속 같은 값을 재사용합니다. */
export function getOrCreateRespondentToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const existing = window.localStorage.getItem(RESPONDENT_TOKEN_KEY);
    if (existing) return existing;
    const token = crypto.randomUUID();
    window.localStorage.setItem(RESPONDENT_TOKEN_KEY, token);
    return token;
  } catch {
    return null;
  }
}
