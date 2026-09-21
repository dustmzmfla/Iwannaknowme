import type { ReactNode } from "react";
import { getCurrentAdmin } from "@/lib/adminAuth";
import { AdminShell } from "@/components/admin/AdminShell";

// middleware.ts가 이미 role === "admin" 이 아니면 이 레이아웃 자체를 렌더링하지 못하게
// 막고 있습니다 (DB의 RLS와 함께 이중 방어). 여기서는 셸(사이드바+상단바)에 관리자 이름만 넘겨줍니다.
export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getCurrentAdmin();

  return <AdminShell adminLabel={admin?.label ?? "관리자"}>{children}</AdminShell>;
}
