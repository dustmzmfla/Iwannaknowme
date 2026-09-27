import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/**
 * 관리자가 다른 유저의 계정을 완전히 삭제합니다 (app/api/account/delete/route.ts의
 * "본인 탈퇴"와 같은 방식 — Supabase Admin API로 auth.users에서 계정 자체를 제거).
 * profiles.id가 auth.users(id)를 on delete cascade로 참조하고, questionnaires.owner_id도
 * profiles(id)를 on delete cascade로 참조하므로 이 유저의 질문지/답변까지 함께
 * 삭제됩니다 — 되돌릴 수 없어서 여기서 관리자 권한과 본인 삭제 여부를 반드시
 * 확인합니다.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId: targetUserId } = await params;

  const supabase = await createClient();
  const {
    data: { user: caller },
  } = await supabase.auth.getUser();

  if (!caller) {
    return NextResponse.json({ error: "로그인이 필요합니다" }, { status: 401 });
  }

  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("role, name")
    .eq("id", caller.id)
    .maybeSingle();

  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "관리자만 가능합니다" }, { status: 403 });
  }

  if (targetUserId === caller.id) {
    return NextResponse.json(
      { error: "자기 자신의 계정은 이 기능으로 삭제할 수 없습니다" },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(targetUserId);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  await admin.from("admin_audit_log").insert({
    actor_id: caller.id,
    actor_label: callerProfile?.name ?? "관리자",
    action: "delete_account",
    target_type: "user",
    target_id: targetUserId,
    note: "관리자가 계정을 완전히 삭제함 (연결된 질문지/답변도 함께 삭제됨)",
  });

  return NextResponse.json({ ok: true });
}
