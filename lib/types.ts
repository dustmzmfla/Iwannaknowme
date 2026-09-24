// 이 파일의 타입들은 실제 Supabase 테이블 스키마(supabase/schema.sql)와 1:1로 맞춰서 설계했습니다.

// 카테고리는 이제 관리자 페이지에서 자유롭게 추가/삭제할 수 있으므로 고정 유니온이 아니라 string 입니다.
export type Category = string;

export type QuestionPool = Record<Category, string[]>;

export type UserRole = "user" | "admin";

/** 회원 등급 — "free"(일반회원) | "paid"(유료회원) | "admin"(관리자, 모든 권한/기능 오픈).
 * 구독권 쿠폰을 등록하면 자동으로 paid가 되고, 관리자로 지정되면 자동으로 admin이 됩니다
 * (admin 등급은 관리자 지정/해제를 통해서만 바뀌고, 쿠폰이나 관리자 페이지에서 직접 줄 수는 없어요). */
export type MembershipTier = "free" | "paid" | "admin";

/** 카카오 로그인으로 가입한 유저 (관리자 페이지의 조회 대상이자, 질문지를 만드는 "질문자") */
export interface AppUser {
  id: string; // Supabase auth user id (uuid)
  kakaoId: string; // 카카오 고유 식별자 (문자열로 저장, 절대 평문 주민번호 아님)
  name: string; // 카카오에서 받아온 닉네임
  avatarUrl: string | null; // 카카오 프로필 사진 URL
  birthDate: string | null; // "선택" 동의 항목. 미동의 시 null
  createdAt: string; // ISO date
  consent: {
    termsAgreedAt: string; // 필수 이용약관 동의 시각
    privacyRequiredAgreedAt: string; // 필수 개인정보 수집 동의 시각
    privacyOptionalAgreedAt: string | null; // 선택 항목(생년월일 등) 동의 시각, 미동의 시 null
  };
  status: "active" | "suspended"; // 관리자가 정지시킬 수 있음
  role: UserRole; // "admin"이면 관리자 페이지 접근 가능 (admin_allowlist와 동기화됨)
  membershipTier: MembershipTier; // 일반회원 / 유료회원 / 관리자
}

/** 한 사용자가 만든 질문지 */
export type QuestionnaireVisibility =
  | "active" // 정상 노출
  | "hidden_by_user"; // 질문자가 "질문 삭제" 클릭 → 질문자 화면에서만 숨김, 관리자는 계속 조회/복구 가능

export interface Questionnaire {
  id: string;
  ownerId: string; // AppUser.id
  questions: string[]; // 발행 시점의 질문 스냅샷 (순서 포함, 3~10개).
  // ⚠️ 질문 수정 기능은 의도적으로 제공하지 않습니다 — 이미 답변이 달린 뒤 질문을 바꾸면
  // 답변과 질문이 서로 안 맞게 꼬이기 때문입니다. 새 질문지가 필요하면 새로 만들어야 합니다.
  relationRequired: true; // 항상 true, 스키마 문서화 목적
  finalMessageRequired: true;
  visibility: QuestionnaireVisibility;
  createdAt: string;
}

export type ResponseVisibility =
  | "active" // 정상 노출
  | "hidden_by_user" // 유저가 "삭제" 버튼 클릭 → 유저 화면에서만 숨김, 관리자는 계속 조회/복구 가능
  | "purged"; // 관리자 영구 삭제 (되돌릴 수 없음)

export interface QuestionResponse {
  id: string;
  questionnaireId: string;
  nickname: string | null; // null이면 익명
  isAnonymous: boolean;
  relationDuration: string; // "1년 미만" 등
  relationCloseness: "악연" | "지인" | "친구" | "절친" | "인연";
  finalMessage: string;
  answers: Record<number, string>; // questionIndex -> 30자 이하 답변
  visibility: ResponseVisibility;
  isRead: boolean; // 질문지 주인이 이 답변을 열어봤는지 여부
  createdAt: string;
  moderatedAt: string | null;
}

export type AdminActionType =
  | "hide_response"
  | "restore_response"
  | "purge_response"
  | "suspend_user"
  | "unsuspend_user"
  | "grant_admin"
  | "revoke_admin"
  | "delete_account"
  | "create_coupon"
  | "delete_coupon"
  | "set_membership_tier";

export interface AdminAuditLog {
  id: string;
  actorId: string; // 관리자 계정 id ("system"이면 유저 스스로 한 행동)
  actorLabel: string;
  action: AdminActionType;
  targetType: "response" | "user" | "admin" | "inquiry" | "questionnaire" | "coupon";
  targetId: string;
  createdAt: string;
  note?: string;
}

/** 질문 카테고리 (관리자 페이지에서 추가/삭제 가능) */
export interface QuestionCategory {
  id: string;
  name: string;
  sortOrder: number;
  createdAt: string;
}

/** 카테고리에 속한 질문 은행 항목 (관리자 페이지에서 추가/삭제 가능) */
export interface QuestionBankItem {
  id: string;
  categoryId: string;
  text: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
}

/** 문의사항 게시판의 글 하나. */
export interface Inquiry {
  id: string;
  authorId: string;
  authorName: string; // 작성 시점 닉네임 스냅샷
  title: string;
  content: string;
  isSecret: boolean; // true면 작성자 본인과 관리자만 열람 가능 (RLS로 강제됨)
  adminReply: string | null;
  repliedBy: string | null;
  repliedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** 관리자로 등록된 카카오 계정 — 이 목록에 있는 kakao_id로 로그인하면 자동으로 role="admin"이 됩니다. */
export interface AdminAllowlistEntry {
  kakaoId: string;
  label: string | null;
  addedBy: string | null; // 등록한 관리자의 AppUser.id
  createdAt: string;
}

/** 프로모션 코드(쿠폰). single = 일회성(전체 통틀어 1회), multi = 다회성(유저별 1회, 여러 명). */
export type CouponType = "single" | "multi";

/** 쿠폰 종류. discount = 할인권(등록 시 discountRate% 할인), subscription = 구독권(등록 시 유료회원으로 업그레이드). */
export type CouponKind = "discount" | "subscription";

export interface Coupon {
  id: string;
  code: string;
  type: CouponType;
  kind: CouponKind;
  discountRate: number | null; // kind가 "discount"일 때만 값이 있음 (1~99)
  createdBy: string | null;
  createdAt: string;
}

/** 쿠폰 하나를 누가, 언제 사용했는지 — 관리자 페이지 "보기" 팝업에 쓰입니다. */
export interface CouponRedemption {
  userId: string;
  userName: string;
  redeemedAt: string;
}

/** 관리자 쿠폰 목록 화면에서 쓰는, 사용 횟수까지 합쳐진 형태. */
export interface CouponWithUsage extends Coupon {
  usedCount: number;
}
