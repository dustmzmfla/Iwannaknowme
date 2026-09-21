"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { useAuth } from "@/lib/auth/AuthProvider";
import { deleteInquiry, getInquiry, replyToInquiry, updateInquiry } from "@/lib/inquiries";
import type { Inquiry } from "@/lib/types";

// Next.js 15에서 params가 Promise가 되면서 페이지 컴포넌트 prop으로 직접
// 받으면 "params.id를 React.use()로 풀어써야 한다"는 경고가 뜹니다 — 이 페이지는
// 클라이언트 컴포넌트라 prop 대신 useParams() 훅으로 라우트 파라미터를 읽어서
// 경고 없이 동일하게 동작하도록 했습니다.
export default function InquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { profile, isAdmin } = useAuth();

  const [inquiry, setInquiry] = useState<Inquiry | null | undefined>(undefined);

  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editSecret, setEditSecret] = useState(false);
  const [saving, setSaving] = useState(false);

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);

  useEffect(() => {
    getInquiry(params.id).then((data) => {
      setInquiry(data);
      if (data) setReplyText(data.adminReply ?? "");
    });
  }, [params.id]);

  if (inquiry === undefined) {
    return (
      <section className="flex flex-col flex-1 px-[22px] py-[26px]">
        <BackButton fallbackHref="/inquiries" />
        <p className="text-sm text-ink-soft">불러오는 중...</p>
      </section>
    );
  }

  if (!inquiry) {
    return (
      <section className="flex flex-col flex-1 px-[22px] py-[26px]">
        <BackButton fallbackHref="/inquiries" />
        <p className="text-sm text-ink-soft">문의를 찾지 못했어. 비밀글이거나 삭제되었을 수 있어요.</p>
      </section>
    );
  }

  const isOwner = !!profile && profile.id === inquiry.authorId;

  function startEdit() {
    if (!inquiry) return;
    setEditTitle(inquiry.title);
    setEditContent(inquiry.content);
    setEditSecret(inquiry.isSecret);
    setEditing(true);
  }

  async function handleSaveEdit() {
    if (!inquiry || !editTitle.trim() || !editContent.trim()) return;
    setSaving(true);
    try {
      await updateInquiry(inquiry.id, {
        title: editTitle.trim(),
        content: editContent.trim(),
        isSecret: editSecret,
      });
      setInquiry({
        ...inquiry,
        title: editTitle.trim(),
        content: editContent.trim(),
        isSecret: editSecret,
        updatedAt: new Date().toISOString(),
      });
      setEditing(false);
    } catch {
      alert("수정하지 못했어요. 잠시 후 다시 시도해줘.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!inquiry) return;
    setDeleting(true);
    try {
      await deleteInquiry(inquiry.id);
      router.push("/inquiries");
    } catch {
      alert("삭제하지 못했어요. 잠시 후 다시 시도해줘.");
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  async function handleReply() {
    if (!inquiry || !replyText.trim()) return;
    setReplying(true);
    try {
      await replyToInquiry(inquiry.id, replyText.trim());
      setInquiry({
        ...inquiry,
        adminReply: replyText.trim(),
        repliedAt: new Date().toISOString(),
      });
    } catch {
      alert("답변을 등록하지 못했어요. 잠시 후 다시 시도해줘.");
    } finally {
      setReplying(false);
    }
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/inquiries" />

      {!editing ? (
        <>
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <h2 className="font-display text-2xl flex items-center gap-1.5 min-w-0">
              {inquiry.isSecret && <span className="shrink-0">🔒</span>}
              <span className="truncate">{inquiry.title}</span>
            </h2>
            <span
              className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                inquiry.adminReply ? "bg-accent text-paper-card" : "bg-black/5 text-ink-soft"
              }`}
            >
              {inquiry.adminReply ? "답변완료" : "답변대기"}
            </span>
          </div>

          <div className="flex items-center justify-between mb-5">
            <span className="text-xs text-ink-soft">{inquiry.authorName}</span>
            <span className="text-xs text-ink-soft">
              {new Date(inquiry.createdAt).toLocaleString("ko-KR")}
            </span>
          </div>

          <div className="bg-paper-card border border-black/10 rounded-2xl p-4 mb-4 whitespace-pre-wrap text-sm leading-relaxed">
            {inquiry.content}
          </div>

          {(isOwner || isAdmin) && !editing && (
            <div className="flex gap-2 mb-6">
              {isOwner && (
                <>
                  <button
                    onClick={startEdit}
                    className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm font-bold active:bg-black/5 transition"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => setConfirmDelete(true)}
                    className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm font-bold text-accent active:bg-black/5 transition"
                  >
                    삭제
                  </button>
                </>
              )}
            </div>
          )}

          {inquiry.adminReply && (
            <div className="bg-paper-card2 rounded-2xl p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-accent">💬 관리자 답변</span>
                {inquiry.repliedAt && (
                  <span className="text-xs text-ink-soft">
                    {new Date(inquiry.repliedAt).toLocaleString("ko-KR")}
                  </span>
                )}
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{inquiry.adminReply}</p>
            </div>
          )}

          {isAdmin && (
            <div className="border border-black/10 rounded-2xl p-4">
              <p className="text-xs font-bold text-ink-soft mb-2">
                {inquiry.adminReply ? "답변 수정 (관리자)" : "답변 작성 (관리자)"}
              </p>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                rows={5}
                placeholder="답변 내용을 입력해줘"
                className="w-full border border-black/15 rounded-xl px-3.5 py-3 text-sm bg-white resize-none leading-relaxed mb-3"
              />
              <Button small onClick={handleReply} disabled={replying || !replyText.trim()}>
                {replying ? "등록 중..." : inquiry.adminReply ? "답변 수정하기" : "답변 등록하기"}
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
          <h2 className="font-display text-2xl mb-5">문의 수정</h2>
          <div className="flex flex-col gap-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              maxLength={80}
              className="border border-black/15 rounded-xl px-3.5 py-3 text-sm bg-white"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={8}
              className="border border-black/15 rounded-xl px-3.5 py-3 text-sm bg-white resize-none leading-relaxed"
            />
            <label className="flex items-center gap-2 text-sm text-ink-soft select-none">
              <input
                type="checkbox"
                checked={editSecret}
                onChange={(e) => setEditSecret(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              🔒 비밀글로 설정
            </label>
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm font-bold active:bg-black/5 transition"
              >
                취소
              </button>
              <Button
                onClick={handleSaveEdit}
                disabled={saving || !editTitle.trim() || !editContent.trim()}
                className="flex-1"
              >
                {saving ? "저장 중..." : "저장"}
              </Button>
            </div>
          </div>
        </>
      )}

      <ConfirmDialog
        open={confirmDelete}
        title="문의를 삭제할까요?"
        description="삭제하면 되돌릴 수 없어요."
        confirmLabel={deleting ? "삭제 중..." : "삭제"}
        danger
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </section>
  );
}
