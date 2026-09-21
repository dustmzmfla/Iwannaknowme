"use client";

// ⚠️ 이 단계는 더 이상 사용하지 않습니다 (2026-09). 질문을 만드는 사람은 나와의
// 관계/하고 싶은 말을 적을 필요가 없어서(그건 답변자 몫이라), /build의 "다음" 버튼이
// 이제 여기를 거치지 않고 바로 질문지를 발행한 뒤 /share/[id]로 이동합니다.
// 삭제 권한이 없어 파일 자체는 지우지 못했지만, 어디서도 이 라우트로 링크하지
// 않으므로 실수로 들어온 경우에만 /build로 돌려보냅니다.
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function RemovedFinalStepPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/build");
  }, [router]);
  return null;
}
