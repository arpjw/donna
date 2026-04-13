"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { Check, X, AlertCircle } from "lucide-react";

type ToastType = "success" | "error";

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setItems((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setItems((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[300] flex flex-col gap-2 pointer-events-none">
        {items.map((item) => (
          <div
            key={item.id}
            className="pointer-events-auto flex items-center gap-3 bg-[#161616] border border-[#262626] rounded px-4 py-3 text-sm font-sans text-[#F0EEE9] shadow-lg min-w-[260px] max-w-[360px]"
            style={{ borderLeft: `3px solid ${item.type === "success" ? "#5A9E6F" : "#C0392B"}` }}
          >
            {item.type === "success"
              ? <Check className="w-4 h-4 shrink-0 text-[#5A9E6F]" />
              : <AlertCircle className="w-4 h-4 shrink-0 text-[#C0392B]" />
            }
            <span className="flex-1">{item.message}</span>
            <button
              onClick={() => dismiss(item.id)}
              className="p-0.5 rounded text-[#737373] hover:text-[#F0EEE9] transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
