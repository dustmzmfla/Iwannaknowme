"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { listInquiries } from "@/lib/inquiries";
import { Pagination } from "@/components/admin/Pagination";
import type { Inquiry } from "@/lib/types";

const PAGE_SIZE = 20;

export default function AdminInquiriesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(() => {
    let cancelled = false;
    setLoading(true);
    listInquiries({ search, page, pageSize: PAGE_SIZE })
      .then((r) => {
        if (cancelled) return;
        setItems(r.items);
        setTotal(r.total);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [search, page]);

  useEffect(() => {
    const cancel = load();
    return cancel;
  }, [load]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-lg font-bold">문의사항</h1>
          <p className="text-xs text-black/50 mt-0.5">전체 {total}건</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput);
            setPage(1);
          }}
          className="flex gap-2 w-full sm:w-auto"
        >
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="제목 · 작성자 검색"
            className="border border-black/15 rounded-md px-3 py-2 text-sm bg-white w-full sm:w-64"
          />
          <button
            type="submit"
            className="text-xs font-bold text-white bg-ink px-3 py-2 rounded-md hover:opacity-80"
          >
            검색
          </button>
        </form>
      </div>

      <div className="bg-white border border-black/10 rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-black/[0.03] text-left text-xs text-black/50">
              <th className="px-4 py-2.5 font-medium w-24">상태</th>
              <th className="px-4 py-2.5 font-medium">제목</th>
              <th className="px-4 py-2.5 font-medium w-32">작성자</th>
              <th className="px-4 py-2.5 font-medium w-28">작성일</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {items.map((inq) => (
              <tr key={inq.id} className="hover:bg-black/[0.015]">
                <td className="px-4 py-2.5">
                  {inq.adminReply ? (
                    <span className="inline-flex items-center text-xs font-bold text-green-700 bg-green-700/10 rounded-full px-2 py-0.5">
                      답변완료
                    </span>
                  ) : (
                    <span className="inline-flex items-center text-xs font-bold text-accent bg-accent/10 rounded-full px-2 py-0.5">
                      답변대기
                    </span>
                  )}
                </td>
                <td className="px-4 py-2.5">
                  <Link
                    href={`/manage-x7k29q/inquiries/${inq.id}`}
                    className="font-bold text-ink hover:text-accent hover:underline"
                  >
                    {inq.isSecret && <span className="mr-1">🔒</span>}
                    {inq.title}
                  </Link>
                </td>
                <td className="px-4 py-2.5 text-black/60">{inq.authorName ?? "익명"}</td>
                <td className="px-4 py-2.5 text-black/60">
                  {new Date(inq.createdAt).toLocaleDateString("ko-KR")}
                </td>
              </tr>
            ))}
            {!loading && items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-black/40">
                  접수된 문의가 없습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
    </div>
  );
}
