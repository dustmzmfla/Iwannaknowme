"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getInquiry, replyToInquiry } from "@/lib/inquiries";
import { Button } from "@/components/ui/Button";
import type { Inquiry } from "@/lib/types";

// Next.js 15에서 params가 Promise가 되면서 페이지 컴포넌트 prop으로 직접
// 받으면 "params.id를 React.use()로 풀어써야 한다"는 경고가 뜹니다 — 이 페이지는
// 클라이언트 컴포넌트라 prop 대신 useParams() 훅으로 라우트 파라미터를 읽어서
// 경고 없이 동일하게 동작하도록 했습니다.
export default function AdminInquiryDetailPage() {
  const params = useParams<{ id: string }>();
  const [inquiry, setInquiry] = useState<Inquiry | null | undefined>(undefined);
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInquiry(params.id).then((data) => {
      setInquiry(data);
      setReplyText(data?.adminReply ?? "");
    });
  }, [params.id]);

  async function handleReply() {
    if (!inquiry || !replyText.trim() || replying) return;
    setReplying(true);
    setError(null);
    try {
      await replyToInquiry(inquiry.id, replyText.trim());
      setInquiry({
        ...inquiry,
        adminReply: replyText.trim(),
        repliedAt: new Date().toISOString(),
      });
    } catch (e: any) {
      setError(e?.message ?? "답변 등록에 실패했습니다.");
    } finally {
      setReplying(false);
    }
  }

  if (inquiry === undefined) {
    return <p className="text-sm text-black/40">불러오는 중...</p>;
  }

  if (inquiry === null) {
    return (
      <div>
        <Link href="/manage-x7k29q/inquiries" className="text-sm text-black/50 hover:underline">
          ← 문의사항 목록
        </Link>
        <p className="mt-4 text-sm text-black/50">문의를 찾을 수 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <Link href="/manage-x7k29q/inquiries" className="text-sm text-black/50 hover:underline">
        ← 문의사항 목록
      </Link>

      <div className="bg-white border border-black/10 rounded-md p-5 mt-4">
        <div className="flex items-center gap-2 flex-wrap">
          {inquiry.isSecret && <span>🔒</span>}
          <h1 className="text-lg font-bold">{inquiry.title}</h1>
          {inquiry.adminReply ? (
            <span className="inline-flex items-center text-xs font-bold text-green-700 bg-green-700/10 rounded-full px-2 py-0.5">
              답변완료
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-bold text-accent bg-accent/10 rounded-full px-2 py-0.5">
              답변대기
            </span>
          )}
        </div>
        <p className="text-xs text-black/50 mt-1">
          {inquiry.authorName} · {new Date(inquiry.createdAt).toLocaleString("ko-KR")}
        </p>
        <p className="text-sm text-ink mt-4 whitespace-pre-wrap leading-relaxed">
          {inquiry.content}
        </p>
      </div>

      <div className="bg-white border border-black/10 rounded-md p-5 mt-4">
        <h2 className="text-sm font-bold mb-2">관리자 답변</h2>
        <textarea
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          rows={6}
          placeholder="답변 내용을 입력하세요"
          className="w-full border border-black/15 rounded-md px-3 py-2.5 text-sm resize-none"
        />
        {error && <p className="text-xs text-accent mt-2">{error}</p>}
        {inquiry.repliedAt && (
          <p className="text-xs text-black/40 mt-2">
            마지막 답변: {new Date(inquiry.repliedAt).toLocaleString("ko-KR")}
          </p>
        )}
        <div className="mt-3">
          <Button
            small
            onClick={handleReply}
            disabled={replying || !replyText.trim()}
          >
            {inquiry.adminReply ? "답변 수정하기" : "답변 등록하기"}
          </Button>
        </div>
      </div>
    </div>
  );
}
