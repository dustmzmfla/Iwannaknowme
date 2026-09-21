"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * 관리자 대시보드의 "오늘 방문자" 숫자를 위한 아주 가벼운 방문 집계기입니다.
 * 브라우저(localStorage)당 하루에 한 번만 record_visit RPC를 호출해서
 * 같은 사람이 페이지를 여러 번 새로고침해도 중복 집계되지 않도록 합니다.
 * 로그인 여부와 무관하게 모든 방문자를 셉니다 (RPC는 anon도 호출 가능).
 */
export function VisitTracker() {
  useEffect(() => {
    const today = new Date().toISOString().slice(0, 10);
    const key = `iwkm_visited_${today}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      // localStorage를 못 쓰는 환경(시크릿 모드 등)이면 그냥 스킵합니다 — 집계 정확도보다
      // 페이지가 멈추지 않는 게 더 중요합니다.
      return;
    }
    const supabase = createClient();
    void (async () => {
      try {
        await supabase.rpc("record_visit");
      } catch {
        // 방문 집계 실패는 조용히 무시합니다.
      }
    })();
  }, []);

  return null;
}
