import type { QuestionPool, Category } from "./types";

export const MIN_QUESTIONS = 3;
export const MAX_QUESTIONS = 10;
export const ANSWER_MAX_LENGTH = 30;

export const QUESTION_POOL: QuestionPool = {
  외모: [
    "내 얼굴에서 가장 눈에 띄는 곳은 어디야?",
    "내 얼굴에 흠이 있다면 어디야?",
    "내가 성형을 한다면 어디를 해야할까?",
    "내가 성형을 한다고 하면 어디를 말리고 싶어?",
    "나의 퍼스널컬러는 무슨 색인 것 같아?",
    "난 쿨톤일까, 웜톤일까?",
    "나의 첫인상은 어땠어?",
    "나랑 닮은 연예인이 누구야?",
    "나랑 닮은 동물은 뭐야?",
    "내 목소리는 듣기에 어떤 편이야?",
    "내 말투는 어떤 것 같아?",
    "나랑 가장 잘 어울리던 헤어스타일이 뭐야?",
    "나는 에겐일까 테토일까?",
    "내가 가장 나다워 보였던 순간은 언제야?",
  ],
  패션: [
    "나의 패션 센스는 어때?",
    "내 최고의 패션은 뭐야?",
    "내 최악의 패션은 뭐야?",
    "내 패션 중에 바꿨으면 하는 부분이 있다면?",
  ],
  성격: [
    "내 성격을 한마디로 표현한다면?",
    "나의 가장 큰 장점은 뭐라고 생각해?",
    "나의 가장 큰 단점은 뭐라고 생각해?",
    "내가 고쳤으면 하는 부분이 있다면?",
    "나랑 있을 때 예상 밖이었던 모습이 있어?",
    "내가 스트레스 받을 때 티가 나는 편이야?",
    "나는 계획적인 편이야, 즉흥적인 편이야?",
    "나에 대해 오해하고 있는 부분이 있다면?",
    "내 성격 중에 가장 나답다고 느끼는 부분은?",
    "나랑 친해지기 전과 후, 인상이 달라졌어?",
    "내가 화났을 때 어떤 모습이야?",
    "나는 잘 삐지는 편이야?",
    "나의 의외의 모습이 있다면?",
    "내가 자존감이 낮아 보일 때가 있어?",
  ],
  관계: [
    "나랑 친해지게 된 결정적 계기가 뭐였어?",
    "나랑 있을 때 가장 편했던 순간은?",
    "나한테 서운했던 적이 있다면 언제야?",
    "나랑 심하게 다퉜을 때 무슨 생각이 들었어?",
    "나랑 다시 만난다면 해주고 싶은 말이 있어?",
    "내가 너한테 좋은 친구였던 순간이 있다면?",
    "나랑 있을 때 눈치 보게 되는 부분이 있어?",
    "나한테 아직 못한 말이 있다면?",
    "나랑 계속 연락하고 지내고 싶어?",
    "나랑 있을 때랑 없을 때, 네 모습이 달라?",
    "나를 다른 사람에게 소개한다면 뭐라고 말할 것 같아?",
    "나랑 안 맞는다고 느꼈던 순간이 있어?",
    "다시 태어나도 나랑 친구 할 거야?",
    "나한테 궁금했지만 못 물어본 게 있어?",
  ],
  추억: [
    "나랑 있었던 일 중에 제일 웃겼던 순간은?",
    "내가 가장 힘들어 보였던 때는 언제였어?",
    "내가 가장 빛나 보였던 순간은?",
    "나 때문에 울었거나 크게 웃었던 적이 있어?",
    "나랑 함께한 순간 중 제일 그리운 때는?",
    "나에 대해 가장 놀랐던 순간이 있어?",
    "나 때문에 힘들었던 적이 있다면?",
    "나랑 있었던 일 중 다시 하고 싶은 게 있어?",
    "내가 가장 나답지 않았던 순간이 있다면?",
    "나에 대한 첫 기억이 뭐야?",
    "나랑 있을 때 뭉클했던 순간이 있어?",
    "나에게 고마웠던 순간이 있다면?",
    "나 때문에 걱정했던 적이 있어?",
    "나랑 함께한 순간 중 자랑하고 싶은 게 있어?",
  ],
  가십: [
    "나에 대해 들은 소문 중에 제일 어이없었던 건?",
    "나에 대해 들었던 말 중에 제일 놀라웠던 건?",
    "나에 대한 소문 중에 반은 맞다고 생각한 거 있어?",
    "나에 대해 다른 사람한테 들은 말 중에 기분 나빴던 거 있어?",
    "나에 대해 들었던 말 중에 오히려 웃겼던 건?",
    "나에 대한 소문 중에 사실 확인하고 싶었던 거 있어?",
    "나에 대해 남들이 뒤에서 뭐라고 할 것 같아?",
    "나에 대해 들은 말 중에 정정해주고 싶었던 거 있어?",
    "나에 대해 제일 많이 도는 소문은 뭐야?",
    "나에 대해 누가 뭐라고 했는데 편들어준 적 있어?",
    "나에 대해 들었던 말 중에 뿌듯했던 거 있어?",
    "나랑 관련된 소문 중에 제일 오래된 건 뭐야?",
    "나에 대해 들었는데 나한테 직접 물어본 적 없는 게 있어?",
    "나에 대한 소문, 솔직히 말해도 괜찮아?",
  ],
};

export const CATEGORIES = Object.keys(QUESTION_POOL) as Category[];

// ---------------- DB 연동 (관리자 페이지에서 추가한 카테고리/질문 반영) ----------------
// Supabase에 카테고리가 하나라도 있으면 DB 데이터를 쓰고, 없거나(아직 마이그레이션 전)
// 네트워크 오류가 나면 위의 정적 QUESTION_POOL로 자연스럽게 폴백합니다.
export async function loadQuestionPool(): Promise<{ categories: Category[]; pool: QuestionPool }> {
  try {
    const { createClient } = await import("./supabase/client");
    const supabase = createClient();
    const { data: categories, error: catError } = await supabase
      .from("categories")
      .select("id, name")
      .order("sort_order");
    if (catError || !categories || categories.length === 0) {
      return { categories: CATEGORIES, pool: QUESTION_POOL };
    }

    const { data: questions } = await supabase
      .from("question_bank")
      .select("category_id, text")
      .eq("is_active", true)
      .order("sort_order");

    const pool: QuestionPool = {};
    for (const c of categories) pool[c.name] = [];
    for (const q of questions ?? []) {
      const cat = categories.find((c) => c.id === q.category_id);
      if (cat) pool[cat.name].push(q.text);
    }

    const hasAnyQuestion = Object.values(pool).some((arr) => arr.length > 0);
    if (!hasAnyQuestion) return { categories: CATEGORIES, pool: QUESTION_POOL };

    return { categories: categories.map((c) => c.name), pool };
  } catch {
    return { categories: CATEGORIES, pool: QUESTION_POOL };
  }
}
