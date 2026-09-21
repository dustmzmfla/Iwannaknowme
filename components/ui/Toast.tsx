"use client";

// 앱 전체에서 재사용하는 토스트입니다. 사용하는 쪽에서는 메시지 문자열만 넘기면 됩니다:
//
//   const { showToast } = useToast();
//   showToast("URL이 복사되었습니다.");
//
// 화면 상단에 고정으로 뜨고, 3초 동안 떠 있다가 자동으로 사라지고, 토스트 자체나
// 뒷배경을 클릭하면 바로 사라집니다. 얇은 바가 3초에 걸쳐 줄어들면서 남은 시간을
// 보여주고, 떠 있는 동안에는 뒷배경이 반투명 흰색으로 살짝 뿌옇게(blur) 보입니다.
// showToast(message, onDismiss)의 onDismiss는 자동 소멸/직접 클릭 소멸 어느 쪽이든
// 토스트가 실제로 사라지는 바로 그 순간 딱 한 번 호출됩니다 — "토스트가 꺼지면
// 페이지 이동" 같은 동작을 여기 하나로 처리할 수 있습니다.
// TOAST_DURATION_MS는 토스트를 띄운 뒤 자동으로 꺼지기까지 걸리는 시간이 필요한
// 곳에서도 가져다 쓸 수 있도록 내보냅니다.

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from "react";

export const TOAST_DURATION_MS = 3000;

type ToastState = { id: number; message: string };

const ToastContext = createContext<{
  showToast: (message: string, onDismiss?: () => void) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idRef = useRef(0);
  const onDismissRef = useRef<(() => void) | undefined>(undefined);

  // 자동 소멸(타이머)과 직접 소멸(클릭)이 결국 같은 곳으로 모이게 해서, onDismiss가
  // 이유와 상관없이 토스트가 사라지는 그 순간 정확히 한 번만 불리도록 합니다.
  const finish = useCallback(() => {
    setToast(null);
    const cb = onDismissRef.current;
    onDismissRef.current = undefined;
    cb?.();
  }, []);

  const dismiss = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    finish();
  }, [finish]);

  const showToast = useCallback((message: string, onDismiss?: () => void) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const id = ++idRef.current;
    onDismissRef.current = onDismiss;
    setToast({ id, message });
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      setToast((prev) => (prev && prev.id === id ? null : prev));
      const cb = onDismissRef.current;
      onDismissRef.current = undefined;
      cb?.();
    }, TOAST_DURATION_MS);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {toast && (
        <>
          {/* 토스트가 떠 있는 동안 뒷배경을 반투명 흰색 + blur로 뿌옇게 만들고,
              배경을 눌러도 토스트를 바로 닫을 수 있게 합니다. */}
          <button
            type="button"
            aria-label="알림 닫기"
            onClick={dismiss}
            className="fixed inset-0 z-[998] bg-white/60 backdrop-blur-sm cursor-default"
          />
          <div className="fixed inset-x-0 top-6 z-[999] flex justify-center px-6 pointer-events-none">
            <button
              key={toast.id}
              type="button"
              onClick={dismiss}
              className="pointer-events-auto max-w-[86%] overflow-hidden rounded-xl bg-ink text-paper-card shadow-xl"
            >
              <div className="px-4 py-3 text-[13px] font-bold text-center break-keep">{toast.message}</div>
              <div className="h-[3px] bg-white/20">
                <div
                  key={toast.id}
                  className="h-full bg-highlight toast-progress-bar"
                  style={{ animationDuration: `${TOAST_DURATION_MS}ms` }}
                />
              </div>
            </button>
          </div>
        </>
      )}

      <style jsx global>{`
        @keyframes toast-progress-shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        .toast-progress-bar {
          animation-name: toast-progress-shrink;
          animation-timing-function: linear;
          animation-fill-mode: forwards;
        }
      `}</style>
    </ToastContext.Provider>
  );
}

/** 어디서든 showToast(message)로 토스트를 띄울 수 있습니다. ToastProvider 하위에서만 사용 가능합니다. */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast는 ToastProvider 안에서만 사용할 수 있어요.");
  return ctx;
}
