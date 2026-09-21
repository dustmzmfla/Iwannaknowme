// "문의사항" 게시판 — 페이지네이션 목록/검색, 글쓰기/수정/삭제, 비밀글, 관리자 답변을 담당합니다.
// 비밀글 접근 제어는 클라이언트가 아니라 Supabase RLS(inquiries_select_visible 정책)가
// DB 레벨에서 강제합니다 — 작성자 본인과 관리자가 아니면 애초에 그 행이 조회되지 않습니다.
import { createClient } from "@/lib/supabase/client";
import type { Inquiry } from "./types";

function rowToInquiry(row: any): Inquiry {
  return {
    id: row.id,
    authorId: row.author_id,
    authorName: row.author_name,
    title: row.title,
    content: row.content,
    isSecret: row.is_secret,
    adminReply: row.admin_reply,
    repliedBy: row.replied_by,
    repliedAt: row.replied_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listInquiries(params: {
  search?: string;
  page: number;
  pageSize: number;
}): Promise<{ items: Inquiry[]; total: number }> {
  const supabase = createClient();
  const q = (params.search ?? "").trim();
  const from = (params.page - 1) * params.pageSize;
  const to = from + params.pageSize - 1;

  let query = supabase
    .from("inquiries")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (q) {
    query = query.or(`title.ilike.%${q}%,content.ilike.%${q}%`);
  }

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;
  return { items: (data ?? []).map(rowToInquiry), total: count ?? 0 };
}

export async function getInquiry(id: string): Promise<Inquiry | null> {
  const supabase = createClient();
  const { data } = await supabase.from("inquiries").select("*").eq("id", id).maybeSingle();
  return data ? rowToInquiry(data) : null;
}

export async function createInquiry(input: {
  title: string;
  content: string;
  isSecret: boolean;
}): Promise<string> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("로그인이 필요합니다");

  const { data: profile } = await supabase.from("profiles").select("name").eq("id", user.id).maybeSingle();

  const { data, error } = await supabase
    .from("inquiries")
    .insert({
      author_id: user.id,
      author_name: profile?.name ?? "사용자",
      title: input.title,
      content: input.content,
      is_secret: input.isSecret,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateInquiry(
  id: string,
  input: { title: string; content: string; isSecret: boolean }
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("inquiries")
    .update({
      title: input.title,
      content: input.content,
      is_secret: input.isSecret,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteInquiry(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("inquiries").delete().eq("id", id);
  if (error) throw error;
}

/** 관리자 전용 — 문의에 답변을 등록/수정합니다. */
export async function replyToInquiry(id: string, reply: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.rpc("admin_reply_inquiry", {
    p_inquiry_id: id,
    p_reply: reply,
  });
  if (error) throw error;
}

export async function getPendingInquiryCount(): Promise<number> {
  const supabase = createClient();
  const { count } = await supabase
    .from("inquiries")
    .select("*", { count: "exact", head: true })
    .is("admin_reply", null);
  return count ?? 0;
}

export async function getRecentPendingInquiries(limit = 5): Promise<Inquiry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("inquiries")
    .select("*")
    .is("admin_reply", null)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(rowToInquiry);
}
