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
            className="pointer-events-auto flex items-center gap-3 rounded px-4 py-3 font-sans min-w-[260px] max-w-[360px]"
            style={{
              background: "#F5F2EC",
              border: `1px solid ${item.type === "success" ? "#C4D8BC" : "#E8C4BC"}`,
              borderLeft: `3px solid ${item.type === "success" ? "#7B9E87" : "#B85C5C"}`,
              fontSize: 13,
              color: "#1C1814",
              boxShadow: "0 4px 16px rgba(28,24,20,0.10)",
            }}
          >
            {item.type === "success"
              ? <Check className="w-4 h-4 shrink-0" style={{ color: "#7B9E87" }} />
              : <AlertCircle className="w-4 h-4 shrink-0" style={{ color: "#B85C5C" }} />
            }
            <span className="flex-1">{item.message}</span>
            <button
              onClick={() => dismiss(item.id)}
              className="p-0.5 rounded transition-colors"
              style={{ color: "#9E9890" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#1C1814")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9E9890")}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
