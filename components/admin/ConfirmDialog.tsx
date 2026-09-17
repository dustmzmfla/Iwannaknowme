"use client";

import { useState } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger,
  requireTypedConfirm,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  requireTypedConfirm?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [typed, setTyped] = useState("");
  if (!open) return null;

  const locked = !!requireTypedConfirm && typed !== requireTypedConfirm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6">
      <div className="w-full max-w-sm bg-white rounded-2xl p-5 shadow-xl">
        <h3 className={`font-bold text-lg mb-2 ${danger ? "text-accent" : "text-ink"}`}>
          {title}
        </h3>
        <p className="text-sm text-ink-soft mb-4 leading-relaxed">{description}</p>

        {requireTypedConfirm && (
          <div className="mb-4">
            <input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={`확인하려면 "${requireTypedConfirm}" 입력`}
              className="w-full border border-black/15 rounded-lg px-3 py-2 text-sm"
            />
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-black/10 text-sm font-bold"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={locked}
            className={`flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-40 ${
              danger ? "bg-accent" : "bg-ink"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
