import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/**
 * 서버 컴포넌트 / 라우트 핸들러 / 서버 액션에서 쓰는 Supabase 클라이언트.
 * 현재 요청의 세션 쿠키를 그대로 사용하므로, 이 클라이언트로 실행되는 쿼리는
 * "로그인한 그 사람"의 권한(RLS)으로 실행됩니다.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출되면 쿠키를 쓸 수 없습니다 — middleware.ts가
            // 매 요청마다 세션 갱신을 대신 처리하므로 여기서는 무시해도 안전합니다.
          }
        },
      },
    }
  );
}

/**
 * ⚠️ service role 키를 사용하는 관리자 전용 클라이언트 — RLS를 완전히 우회합니다.
 * 절대 브라우저로 내려보내지 말고, 라우트 핸들러(app/api/**)에서만,
 * 그것도 반드시 "요청자가 본인/관리자인지" 세션 검증을 마친 뒤에만 사용하세요.
 * (지금은 계정 완전 삭제 — auth.users row 삭제 — 에만 사용합니다.)
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
