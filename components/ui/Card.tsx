import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`bg-paper-card border border-black/10 rounded-2xl p-[18px] mb-4 ${className}`}>
      {children}
    </div>
  );
}
