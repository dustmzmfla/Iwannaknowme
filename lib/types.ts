// 이 파일의 타입들은 실제 Supabase 테이블 스키마와 1:1로 맞춰서 설계했습니다.
// 나중에 mockDb.ts 를 Supabase 클라이언트 호출로 교체할 때 타입은 그대로 재사용하면 됩니다.

export type Category = "외모" | "성격" | "관계" | "추억" | "가십";

export type QuestionPool = Record<Category, string[]>;

/** 카카오 로그인으로 가입한 "질문자" (관리자 페이지의 조회 대상) */
export interface AppUser {
  id: string; // Supabase auth user id (uuid)
  kakaoId: string; // 카카오 고유 식별자 (문자열로 저장, 절대 평문 주민번호 아님)
  name: string; // 카카오 동의 항목으로 받은 이름/닉네임
  birthDate: string | null; // "선택" 동의 항목. 미동의 시 null
  createdAt: string; // ISO date
  consent: {
    termsAgreedAt: string; // 필수 이용약관 동의 시각
    privacyRequiredAgreedAt: string; // 필수 개인정보 수집 동의 시각
    privacyOptionalAgreedAt: string | null; // 선택 항목(생년월일 등) 동의 시각, 미동의 시 null
  };
  status: "active" | "suspended"; // 관리자가 정지시킬 수 있음
}

/** 한 사용자가 만든 질문지 */
export interface Questionnaire {
  id: string;
  ownerId: string; // AppUser.id
  questions: string[]; // 순서 포함, 3~10개
  relationRequired: true; // 항상 true, 스키마 문서화 목적
  finalMessageRequired: true;
  createdAt: string;
}

export type ResponseVisibility =
  | "active" // 정상 노출
  | "hidden_by_user" // 유저가 "삭제" 버튼 클릭 → 유저 화면에서만 숨김, 관리자는 계속 조회/복구 가능
  | "purged"; // 관리자 영구 삭제 → 실제로 이 상태가 되면 DB에서 row 자체를 지우는 게 맞지만,
//              데모에서는 감사 로그 확인을 위해 상태값으로만 남겨둠 (실서비스에선 완전 삭제 + 별도 삭제 로그만 유지 권장)

export interface QuestionResponse {
  id: string;
  questionnaireId: string;
  nickname: string | null; // null이면 익명
  isAnonymous: boolean;
  relationDuration: string; // "1년 미만" 등
  relationCloseness: "악연" | "지인" | "친구" | "인연";
  finalMessage: string;
  answers: Record<number, string>; // questionIndex -> 30자 이하 답변
  visibility: ResponseVisibility;
  createdAt: string;
  moderatedAt: string | null; // 마지막으로 숨김/복구/영구삭제가 일어난 시각
}

export type AdminActionType =
  | "hide_response" // 유저가 실행 (참고용으로 로그에 남김)
  | "restore_response" // 관리자가 실행
  | "purge_response" // 관리자가 실행 (영구 삭제, 되돌릴 수 없음)
  | "suspend_user"
  | "unsuspend_user";

/** 관리자 활동 로그 — 누가/언제/무엇을 했는지 반드시 남겨야 영구삭제 같은 민감한 기능을 안전하게 운영할 수 있음 */
export interface AdminAuditLog {
  id: string;
  actorId: string; // 관리자 계정 id ("system"이면 유저 스스로 한 행동)
  actorLabel: string;
  action: AdminActionType;
  targetType: "response" | "user";
  targetId: string;
  createdAt: string;
  note?: string;
}
