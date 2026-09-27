"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  listCategories,
  listQuestionBank,
  addCategory,
  updateCategory,
  reorderCategories,
  deleteCategory,
  addQuestion,
  updateQuestion,
  reorderQuestions,
  deleteQuestion,
} from "@/lib/mockDb";
import { ConfirmDialog } from "@/components/admin/ConfirmDialog";
import { QuestionListEditor } from "@/components/admin/QuestionListEditor";
import { useDragReorder } from "@/lib/useDragReorder";
import type { QuestionBankItem, QuestionCategory } from "@/lib/types";

export default function AdminQuestionsPage() {
  const [categories, setCategories] = useState<QuestionCategory[]>([]);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCategory, setNewCategory] = useState("");
  const [newQuestionByCategory, setNewQuestionByCategory] = useState<Record<string, string>>({});
  const [deleteCategoryTarget, setDeleteCategoryTarget] = useState<QuestionCategory | null>(null);
  const [busy, setBusy] = useState(false);

  // 아코디언 접힌 카테고리 id 목록입니다. 기본은 전부 펼쳐진 상태입니다.
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(new Set());
  // 지금 이름을 수정 중인 카테고리(있으면 그 id/입력값)입니다.
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);

  const categoryListRef = useRef<HTMLDivElement>(null);

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

  function toggleCollapsed(categoryId: string) {
    setCollapsedIds((prev) => {
      const next = new Set(prev);
      if (next.has(categoryId)) next.delete(categoryId);
      else next.add(categoryId);
      return next;
    });
  }

  // 카테고리 순서를 드래그로 바꿉니다 - 화면은 바로 반영(낙관적 업데이트)하고,
  // 실제 저장은 뒤에서 admin_reorder_categories RPC로 처리합니다. 저장에
  // 실패하면 서버 상태로 다시 불러와 화면을 원래대로 되돌립니다.
  function handleReorderCategories(from: number, to: number) {
    setCategories((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      reorderCategories(next.map((c) => c.id)).catch((e) => {
        // 저장에 실패하면 화면을 서버 상태로 되돌리기 전에, 실패했다는 걸
        // 반드시 알려줍니다 - 예전엔 조용히 되돌아가서 "드래그는 되는데
        // 실제로 적용은 안 된다"는 것처럼 보였습니다.
        console.error("카테고리 순서 저장 실패:", e);
        alert(`카테고리 순서를 저장하지 못했어요: ${e?.message ?? e}`);
        refresh();
      });
      return next;
    });
  }

  // 한 카테고리 안에서 질문 순서를 드래그로 바꿉니다. questions는 전체 카테고리를
  // 합친 하나의 배열이라, 이 카테고리에 속한 항목들만 골라 순서를 바꾼 뒤 나머지와
  // 합칩니다(다른 카테고리 항목들의 배열상 위치는 렌더링에 영향을 주지 않아요 -
  // 항상 categoryId로 다시 필터링해서 보여주기 때문입니다).
  function handleReorderQuestions(categoryId: string, from: number, to: number) {
    setQuestions((prev) => {
      const catItems = prev.filter((q) => q.categoryId === categoryId);
      const others = prev.filter((q) => q.categoryId !== categoryId);
      const reordered = [...catItems];
      const [moved] = reordered.splice(from, 1);
      reordered.splice(to, 0, moved);
      reorderQuestions(categoryId, reordered.map((q) => q.id)).catch((e) => {
        // 저장에 실패하면 화면을 서버 상태로 되돌리기 전에, 실패했다는 걸
        // 반드시 알려줍니다 - 예전엔 조용히 되돌아가서 "드래그는 되는데
        // 실제로 적용은 안 된다"는 것처럼 보였습니다.
        console.error("질문 순서 저장 실패:", e);
        alert(`질문 순서를 저장하지 못했어요: ${e?.message ?? e}`);
        refresh();
      });
      return [...others, ...reordered];
    });
  }

  function getCategorySiblings(): HTMLElement[] {
    return Array.from(categoryListRef.current?.querySelectorAll("[data-cat-item]") ?? []) as HTMLElement[];
  }

  const { startDrag: startCatDrag, moveDrag: moveCatDrag, endDrag: endCatDrag } = useDragReorder(
    categories,
    handleReorderCategories
  );

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

  async function handleSaveCategoryName() {
    if (!editingCategory) return;
    const name = editingCategory.name.trim();
    if (!name) {
      setEditingCategory(null);
      return;
    }
    setBusy(true);
    try {
      await updateCategory(editingCategory.id, name);
      setEditingCategory(null);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "카테고리 이름을 수정하지 못했어요.");
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

  async function handleUpdateQuestionText(q: QuestionBankItem, newText: string) {
    setBusy(true);
    try {
      await updateQuestion(q.id, newText, q.isActive);
      await refresh();
    } catch (e: any) {
      alert(e?.message ?? "질문을 수정하지 못했어요.");
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
          className="flex-1 min-w-0 border border-black/15 rounded-xl px-3.5 py-2.5 text-sm"
        />
        <button
          onClick={handleAddCategory}
          disabled={busy || !newCategory.trim()}
          className="flex-none px-4 py-2.5 rounded-xl bg-ink text-paper-card text-sm font-bold disabled:opacity-40"
        >
          추가
        </button>
      </div>

      {loading && <p className="text-ink-soft">불러오는 중...</p>}

      <div ref={categoryListRef}>
        {!loading &&
          categories.map((cat, i) => {
            const items = questions.filter((q) => q.categoryId === cat.id);
            const collapsed = collapsedIds.has(cat.id);
            const isEditingThis = editingCategory?.id === cat.id;
            return (
              <div
                key={cat.id}
                data-cat-item
                className="bg-white rounded-2xl border border-black/10 p-5 mb-4 will-change-transform"
                style={{ transition: "transform 220ms cubic-bezier(.2,.8,.2,1)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="text-ink-soft text-base px-0.5 cursor-grab touch-none shrink-0"
                    onPointerDown={(e) => {
                      if (isEditingThis) return;
                      const itemEl = e.currentTarget.closest("[data-cat-item]") as HTMLElement;
                      startCatDrag(e, i, itemEl, getCategorySiblings());
                      itemEl.style.transition = "none";
                      itemEl.style.zIndex = "20";
                    }}
                    onPointerMove={(e) => {
                      const itemEl = e.currentTarget.closest("[data-cat-item]") as HTMLElement;
                      moveCatDrag(e, itemEl, getCategorySiblings());
                    }}
                    onPointerUp={(e) => {
                      const itemEl = e.currentTarget.closest("[data-cat-item]") as HTMLElement;
                      itemEl.style.transition = "";
                      itemEl.style.zIndex = "";
                      endCatDrag(itemEl, getCategorySiblings());
                    }}
                  >
                    ⠿
                  </span>

                  <button
                    type="button"
                    onClick={() => toggleCollapsed(cat.id)}
                    aria-label={collapsed ? "카테고리 펼치기" : "카테고리 접기"}
                    className="shrink-0 w-6 h-6 flex items-center justify-center text-ink-soft"
                  >
                    <svg
                      viewBox="0 0 20 20"
                      width={14}
                      height={14}
                      className={`transition-transform duration-200 ${collapsed ? "-rotate-90" : ""}`}
                    >
                      <path
                        d="M5 7l5 5 5-5"
                        stroke="currentColor"
                        strokeWidth={2}
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </button>

                  {isEditingThis ? (
                    <>
                      <input
                        autoFocus
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ id: cat.id, name: e.target.value })}
                        onKeyDown={(e) => e.key === "Enter" && handleSaveCategoryName()}
                        className="flex-1 min-w-0 bg-white border border-black/15 rounded-lg px-2 py-1 font-bold text-lg"
                      />
                      <button
                        onClick={handleSaveCategoryName}
                        disabled={busy}
                        className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg bg-ink text-paper-card"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => setEditingCategory(null)}
                        className="shrink-0 text-xs font-bold px-2.5 py-1 rounded-lg border border-black/15"
                      >
                        취소
                      </button>
                    </>
                  ) : (
                    <>
                      <h2 className="flex-1 min-w-0 truncate font-bold text-lg">
                        {cat.name}{" "}
                        <span className="text-sm text-ink-soft font-normal">({items.length}개)</span>
                      </h2>
                      <button
                        onClick={() => setEditingCategory({ id: cat.id, name: cat.name })}
                        className="shrink-0 whitespace-nowrap text-xs font-bold px-2.5 py-1 rounded-lg border border-black/15"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => setDeleteCategoryTarget(cat)}
                        className="shrink-0 whitespace-nowrap text-xs font-bold text-accent px-2.5 py-1 rounded-lg border border-accent/40"
                      >
                        카테고리 삭제
                      </button>
                    </>
                  )}
                </div>

                <div
                  className="grid transition-[grid-template-rows] duration-300 ease-out"
                  style={{ gridTemplateRows: collapsed ? "0fr" : "1fr" }}
                >
                  <div className="overflow-hidden">
                    <QuestionListEditor
                      items={items}
                      busy={busy}
                      onToggleActive={handleToggleActive}
                      onUpdateText={handleUpdateQuestionText}
                      onDelete={handleDeleteQuestion}
                      onReorder={(from, to) => handleReorderQuestions(cat.id, from, to)}
                    />

                    <div className="flex gap-2">
                      <input
                        value={newQuestionByCategory[cat.id] ?? ""}
                        onChange={(e) =>
                          setNewQuestionByCategory((prev) => ({ ...prev, [cat.id]: e.target.value }))
                        }
                        onKeyDown={(e) => e.key === "Enter" && handleAddQuestion(cat.id)}
                        placeholder="새 질문 입력"
                        className="flex-1 min-w-0 border border-black/15 rounded-xl px-3.5 py-2 text-sm"
                      />
                      <button
                        onClick={() => handleAddQuestion(cat.id)}
                        disabled={busy || !(newQuestionByCategory[cat.id] ?? "").trim()}
                        className="flex-none px-3.5 py-2 rounded-xl bg-white border border-black/15 text-sm font-bold disabled:opacity-40"
                      >
                        추가
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

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
