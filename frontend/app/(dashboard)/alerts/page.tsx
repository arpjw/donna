"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { alertsApi } from "@/lib/api";
import type { Alert } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { CardSkeleton } from "@/components/ui/skeleton";
import { Bell, Check, X } from "lucide-react";
import Link from "next/link";

export default function AlertsPage() {
  const { getToken } = useAuth();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const token = await getToken();
        const result = await alertsApi.list(token ?? undefined);
        setAlerts(result.items);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to load alerts");
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [getToken]);

  const sendFeedback = async (id: string, feedback: "relevant" | "not_relevant") => {
    try {
      const token = await getToken();
      await alertsApi.feedback(id, feedback, token ?? undefined);
      setAlerts((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, feedback } as Alert : a
        )
      );
    } catch {
      // silent fail
    }
  };

  return (
    <div className="max-w-[860px] mx-auto px-8 py-8">
      <div className="border-b border-border pb-5 mb-8">
        <h1 className="font-display text-3xl font-semibold text-text-primary">
          Alerts
        </h1>
        <p className="text-sm text-text-secondary font-sans mt-1">
          Real-time alerts for high-impact regulatory changes
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <p className="text-text-secondary text-sm font-sans">{error}</p>
      ) : alerts.length === 0 ? (
        <div className="border border-border rounded p-12 text-center">
          <Bell className="w-8 h-8 text-text-tertiary mx-auto mb-3" />
          <p className="font-display text-xl text-text-primary mb-2">No alerts yet.</p>
          <p className="text-sm text-text-secondary font-sans max-w-sm mx-auto">
            Donna will notify you here when high-impact changes are published.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} onFeedback={sendFeedback} />
          ))}
        </div>
      )}
    </div>
  );
}

function AlertCard({
  alert,
  onFeedback,
}: {
  alert: Alert;
  onFeedback: (id: string, f: "relevant" | "not_relevant") => void;
}) {
  const statusColor =
    alert.status === "sent"
      ? "text-impact-low"
      : alert.status === "failed"
      ? "text-impact-high"
      : "text-text-tertiary";

  return (
    <div className="border border-border rounded p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`text-[10px] font-mono uppercase tracking-wider ${statusColor}`}>
              {alert.status}
            </span>
            <span className="text-[10px] text-text-tertiary font-mono">
              {formatDate(alert.created_at)}
            </span>
            <span className="text-[10px] text-text-tertiary font-mono">
              via {alert.channel}
            </span>
          </div>
          <p className="text-sm font-sans text-text-primary font-medium mb-1">
            {alert.subject}
          </p>
          {alert.change && (
            <Link
              href={`/document/${alert.change.processed_document_id}`}
              className="text-xs text-crimson hover:underline font-mono"
            >
              View document →
            </Link>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onFeedback(alert.id, "relevant")}
            className="p-1.5 rounded hover:bg-white/5 text-text-tertiary hover:text-impact-low transition-colors"
            title="Relevant"
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onFeedback(alert.id, "not_relevant")}
            className="p-1.5 rounded hover:bg-white/5 text-text-tertiary hover:text-impact-high transition-colors"
            title="Not relevant"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
