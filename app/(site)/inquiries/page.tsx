"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BackButton } from "@/components/ui/BackButton";
import { Pagination } from "@/components/admin/Pagination";
import { listInquiries } from "@/lib/inquiries";
import type { Inquiry } from "@/lib/types";

const PAGE_SIZE = 10;

export default function InquiriesListPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Inquiry[]>([]);
  const [total, setTotal] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items, total } = await listInquiries({ search, page, pageSize: PAGE_SIZE });
      setItems(items);
      setTotal(total);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    load();
  }, [load]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  }

  return (
    <section className="flex flex-col flex-1 px-[22px] py-[26px]">
      <BackButton fallbackHref="/" />

      <div className="flex items-center justify-between mb-1.5 gap-2">
        <h2 className="font-display text-2xl">문의사항</h2>
        <button
          onClick={() => router.push("/inquiries/new")}
          className="shrink-0 text-xs font-bold bg-accent text-paper-card px-3 py-2 rounded-full active:scale-95 transition"
        >
          ✏️ 글쓰기
        </button>
      </div>
      <p className="text-[13.5px] text-ink-soft mb-5 leading-relaxed">
        궁금한 점이나 불편한 점을 남겨주면 확인 후 답변해드릴게요.
      </p>

      <form onSubmit={handleSearchSubmit} className="flex gap-2 mb-4">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="제목이나 내용으로 검색"
          className="flex-1 border border-black/15 rounded-xl px-3.5 py-2.5 text-sm bg-white"
        />
        <button
          type="submit"
          className="shrink-0 text-sm font-bold border border-black/15 rounded-xl px-4 py-2.5 bg-white active:bg-black/5 transition"
        >
          검색
        </button>
      </form>

      {loading && <p className="text-sm text-ink-soft">불러오는 중...</p>}

      {!loading && items.length === 0 && (
        <p className="text-sm text-ink-soft">
          {search ? "검색 결과가 없어요." : "아직 등록된 문의가 없어요."}
        </p>
      )}

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/inquiries/${item.id}`}
            className="block bg-paper-card border border-black/10 rounded-2xl p-4 active:scale-[0.99] transition"
          >
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span className="font-bold text-[14.5px] truncate flex items-center gap-1.5 min-w-0">
                {item.isSecret && <span className="shrink-0">🔒</span>}
                <span className="truncate">{item.title}</span>
              </span>
              <span
                className={`shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
                  item.adminReply
                    ? "bg-accent text-paper-card"
                    : "bg-black/5 text-ink-soft"
                }`}
              >
                {item.adminReply ? "답변완료" : "답변대기"}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-ink-soft truncate">{item.authorName}</span>
              <span className="shrink-0 text-xs text-ink-soft">
                {new Date(item.createdAt).toLocaleDateString("ko-KR")}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {!loading && total > PAGE_SIZE && (
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onChange={setPage} />
      )}
    </section>
  );
}
