import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";

// middleware.ts가 이미 role === "admin" 이 아니면 이 레이아웃 자체를 렌더링하지 못하게
// 막고 있습니다 (DB의 RLS와 함께 이중 방어). 관리자 이름 표시는 AdminShell이 이미 로드된
// AuthProvider의 profile을 그대로 읽어서 보여줍니다.
// ⚠️(2026-09 성능 최적화): 예전엔 여기서 getCurrentAdmin()으로 getUser()+profiles 조회를
// 한 번 더 했는데, middleware가 이미 확실하게 막고 있고 결과는 화면표시용 이름 하나뿐이라
// 관리자 페이지를 이동할 때마다 불필요한 네트워크 왕복 2번이 추가되고 있었습니다.
export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
