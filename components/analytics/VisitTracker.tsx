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
    // ⚠️(2026-09 버그 수정): toISOString()은 UTC 기준이라 한국 자정이 지나도
    // 최대 9시간 동안 "오늘" 키가 안 바뀌어서, 이 시간대에는 새로 방문해도
    // record_visit이 다시 호출되지 않았습니다(서버 집계는 이미 Asia/Seoul 기준으로
    // 고쳤으니, 클라이언트도 같은 기준으로 맞춰야 안 어긋납니다).
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Seoul" }).format(new Date());
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
