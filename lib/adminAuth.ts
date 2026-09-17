import { createClient } from "@/lib/supabase/server";

export interface CurrentAdmin {
  id: string;
  label: string;
}

/**
 * 서버 컴포넌트/라우트 핸들러에서 "현재 세션이 관리자인가"를 확인합니다.
 * 실제 접근 차단은 middleware.ts(+ DB의 RLS)가 이중으로 담당하고,
 * 이 함수는 admin 레이아웃에서 이름을 보여주거나 최후 방어선으로 한 번 더
 * 확인하는 용도로 씁니다. 관리자가 아니면 null을 반환합니다.
 */
export async function getCurrentAdmin(): Promise<CurrentAdmin | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") return null;
  return { id: user.id, label: profile.name ?? "관리자" };
}
