"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getDashboardStats, type DashboardStats } from "@/lib/adminDashboard";
import { getRecentPendingInquiries } from "@/lib/inquiries";
import { getRecentUsers } from "@/lib/mockDb";
import type { AppUser, Inquiry } from "@/lib/types";

const EMPTY_STATS: DashboardStats = {
  todayVisits: 0,
  totalUsers: 0,
  newUsersToday: 0,
  totalQuestionnaires: 0,
  newQuestionnairesToday: 0,
  totalResponses: 0,
  pendingInquiries: 0,
  totalInquiries: 0,
};

function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: number | string;
  sub?: string;
}) {
  return (
    <div className="bg-white border border-black/10 rounded-md p-4">
      <p className="text-xs text-black/50 mb-1.5">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-[11px] text-black/40 mt-1">{sub}</p>}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [pendingInquiries, setPendingInquiries] = useState<Inquiry[]>([]);
  const [recentUsers, setRecentUsers] = useState<AppUser[]>([]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    Promise.all([getDashboardStats(), getRecentPendingInquiries(5), getRecentUsers(5)])
      .then(([s, inquiries, users]) => {
        if (cancelled) return;
        setStats(s);
        setPendingInquiries(inquiries);
        setRecentUsers(users);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="max-w-6xl">
      <h1 className="text-lg font-bold mb-4">대시보드</h1>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="오늘 방문자" value={loading ? "-" : stats.todayVisits} />
        <StatCard
          label="오늘 생성된 질문지"
          value={loading ? "-" : stats.newQuestionnairesToday}
          sub={`전체 ${stats.totalQuestionnaires}개`}
        />
        <StatCard
          label="오늘 신규 가입"
          value={loading ? "-" : stats.newUsersToday}
          sub={`전체 유저 ${stats.totalUsers}명`}
        />
        <StatCard
          label="답변 대기 문의"
          value={loading ? "-" : stats.pendingInquiries}
          sub={`전체 문의 ${stats.totalInquiries}건`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white border border-black/10 rounded-md">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
            <h2 className="text-sm font-bold">답변 대기 중인 문의</h2>
            <Link href="/manage-x7k29q/inquiries" className="text-xs text-accent font-bold hover:underline">
              전체 보기
            </Link>
          </div>
          {pendingInquiries.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-black/40">
              {loading ? "불러오는 중..." : "답변 대기 중인 문의가 없어요."}
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {pendingInquiries.map((inq) => (
                <li key={inq.id}>
                  <Link
                    href={`/manage-x7k29q/inquiries/${inq.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-black/[0.02]"
                  >
                    <span className="truncate flex items-center gap-1.5 min-w-0">
                      {inq.isSecret && <span className="shrink-0">🔒</span>}
                      <span className="truncate">{inq.title}</span>
                    </span>
                    <span className="shrink-0 text-xs text-black/40">
                      {new Date(inq.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white border border-black/10 rounded-md">
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/10">
            <h2 className="text-sm font-bold">최근 가입한 유저</h2>
            <Link href="/manage-x7k29q/users" className="text-xs text-accent font-bold hover:underline">
              전체 보기
            </Link>
          </div>
          {recentUsers.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-black/40">
              {loading ? "불러오는 중..." : "가입한 유저가 없어요."}
            </p>
          ) : (
            <ul className="divide-y divide-black/5">
              {recentUsers.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/manage-x7k29q/users/${u.id}`}
                    className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-black/[0.02]"
                  >
                    <span className="truncate">{u.name}</span>
                    <span className="shrink-0 text-xs text-black/40">
                      {new Date(u.createdAt).toLocaleDateString("ko-KR")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
