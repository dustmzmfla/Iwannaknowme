"use client";

import { useCallback, useEffect, useState } from "react";
import {
  listCategories,
  listQuestionBank,
  addCategory,
  deleteCategory,
  addQuestion,
  updateQuestion,
  deleteQuestion,
} from "@/lib/mockDb";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import type { QuestionBankItem, QuestionCategory } from "@/lib/types";

export default function AdminQuestionsPage() {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [newQuestionByCategory, setNewQuestionByCategory] = useState<Record<string, string>>({});
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<QuestionCategory | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [cats, qs] = await Promise.all([listCategories(), listQuestionBank()]);
    setCategories(cats);
    setQuestions(qs);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleAddCategory() {
    const name = newCategory.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      await addCategory(name);
      setNewCategory("");
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "카테고리를 추가하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleAddQuestion(categoryId: string) {
    const text = (newQuestionByCategory[categoryId] ?? "").trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      await addQuestion(categoryId, text);
      setNewQuestionByCategory((prev) => ({ ...prev, [categoryId]: "" }));
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "질문을 추가하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  async function handleToggleActive(q: QuestionBankItem) {
    setBusy(true);
    try {
      await updateQuestion(q.id, q.text, !q.isActive);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteQuestion(q: QuestionBankItem) {
    if (!confirm("이 질문을 삭제할까요? 이미 발행된 질문지에는 영향이 없어요.")) return;
    setBusy(true);
    try {
      await deleteQuestion(q.id);
      await refresh();
    } finally {
      setBusy(false);
    }
  }

  async function handleDeleteCategory() {
    if (!deleteCategoryTarget) return;
    setBusy(true);
    try {
      await deleteCategory(deleteCategoryTarget.id);
      setDeleteCategoryTarget(null);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "카테고리를 삭제하지 못했어요.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">카테고리·질문 관리</h1>
      </div>

      <p className="text-sm text-ink-soft mb-4">
        여기서 추가/수정/삭제해도 <b>이미 발행된 질문지</b>는 발행 시점 스냅샷을
        그대로 유지하므로 영향받지 않아요 (그래서 질문 수정 기능이 따로 없는 거예요
        — 발행 후 질문을 바꾸면 이미 받은 답변과 순서가 어긋나기 때문). 새로 만드는
        질문지부터 반영됩니다.
      </p>

      <div className="bg-white rounded-2xl border border-black/10 p-5 mb-6 flex gap-2">
        <input
          value={newCategory}
          onChange={(e) => setNewCategory(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAddCategory()}
          placeholder="새 카테고리 이름 (예: 취향)"
          className="flex-1 border border-black/15 rounded-xl px-3.5 py-2.5 text-sm"
        />
        <button
          onClick={handleAddCategory}
          disabled={busy || !newCategory.trim()}
          className="px-4 py-2.5 rounded-xl bg-ink text-paper-card text-sm font-bold disabled:opacity-40"
        >
          카테고리 추가
        </button>
      </div>

      {loading && <p className="text-ink-soft">불러오는 중...</p>}

      {!loading &&
        categories.map((cat) => {
          const items = questions.filter((q) => q.categoryId === cat.id);
          return (
            <div key={cat.id} className="bg-white rounded-2xl border border-black/10 p-5 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-lg">
                  {cat.name} <span className="text-sm text-ink-soft font-normal">({items.length}개)</span>
                </h2>
                <button
                  onClick={() => setDeleteCategoryTarget(cat)}
                  className="text-xs font-bold text-accent px-2.5 py-1 rounded-lg border border-accent/40"
                >
                  카테고리 삭제
                </button>
              </div>

              <ul className="space-y-1.5 mb-3">
                {items.map((q) => (
                  <li
                    key={q.id}
                    className={`flex items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
                      q.isActive ? "bg-paper-card2" : "bg-black/[0.03] text-ink-soft line-through"
                    }`}
                  >
                    <span className="flex-1">{q.text}</span>
                    <button
                      onClick={() => handleToggleActive(q)}
                      className="text-xs font-bold px-2 py-1 rounded-lg border border-black/15 shrink-0"
                    >
                      {q.isActive ? "비활성화" : "활성화"}
                    </button>
                    <button
                      onClick={() => handleDeleteQuestion(q)}
                      className="text-xs font-bold px-2 py-1 rounded-lg border border-accent/40 text-accent shrink-0"
                    >
                      삭제
                    </button>
                  </li>
                ))}
                {items.length === 0 && (
                  <li className="text-sm text-ink-soft py-2">아직 질문이 없어요.</li>
                )}
              </ul>

              <div className="flex gap-2">
                <input
                  value={newQuestionByCategory[cat.id] ?? ""}
                  onChange={(e) =>
                    setNewQuestionByCategory((prev) => ({ ...prev, [cat.id]: e.target.value }))
                  }
                  onKeyDown={(e) => e.key === "Enter" && handleAddQuestion(cat.id)}
                  placeholder="새 질문 입력"
                  className="flex-1 border border-black/15 rounded-xl px-3.5 py-2 text-sm"
                />
                <button
                  onClick={() => handleAddQuestion(cat.id)}
                  disabled={busy || !(newQuestionByCategory[cat.id] ?? "").trim()}
                  className="px-3.5 py-2 rounded-xl bg-white border border-black/15 text-sm font-bold disabled:opacity-40"
                >
                  질문 추가
                </button>
              </div>
            </div>
          );
        })}

      <ConfirmDialog
        open={!!deleteCategoryTarget}
        title="카테고리를 삭제할까요?"
        description={`'${deleteCategoryTarget?.name}' 카테고리와 그 안의 모든 질문이 함께 삭제됩니다. 이미 발행된 질문지에는 영향이 없어요.`}
        confirmLabel="삭제"
        danger
        onCancel={() => setDeleteCategoryTarget(null)}
        onConfirm={handleDeleteCategory}
      />
    </div>
  );
}
