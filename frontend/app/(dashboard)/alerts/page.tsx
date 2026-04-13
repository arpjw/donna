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
        prev.map((a) => a.id === id ? { ...a, feedback } as Alert : a)
      );
    } catch {
      // silent
    }
  };

  return (
    <div className="max-w-[860px] mx-auto px-8 py-8">
      <div className="pb-5 mb-8" style={{ borderBottom: "1px solid #E2DDD5" }}>
        <h1 className="font-display" style={{ fontSize: 26, color: "#1C1814" }}>
          Alerts
        </h1>
        <p className="font-sans text-sm mt-1" style={{ color: "#6B655C", fontWeight: 300 }}>
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
        <p className="font-sans text-sm" style={{ color: "#6B655C" }}>{error}</p>
      ) : alerts.length === 0 ? (
        <div
          className="rounded p-12 text-center"
          style={{ border: "1px solid #E2DDD5" }}
        >
          <Bell className="w-8 h-8 mx-auto mb-3" style={{ color: "#D5D0C8" }} />
          <p className="font-display text-xl mb-2" style={{ color: "#1C1814" }}>No alerts yet.</p>
          <p className="font-sans text-sm max-w-sm mx-auto" style={{ color: "#6B655C", fontWeight: 300 }}>
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
  const statusStyle =
    alert.status === "sent"
      ? { color: "#7B9E87" }
      : alert.status === "failed"
      ? { color: "#B85C5C" }
      : { color: "#9E9890" };

  return (
    <div
      className="rounded p-5"
      style={{ background: "#F5F2EC", border: "1px solid #E2DDD5" }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-mono uppercase tracking-wider" style={{ fontSize: 10, ...statusStyle }}>
              {alert.status}
            </span>
            <span className="font-mono" style={{ fontSize: 10, color: "#9E9890" }}>
              {formatDate(alert.created_at)}
            </span>
            <span className="font-mono" style={{ fontSize: 10, color: "#9E9890" }}>
              via {alert.channel}
            </span>
          </div>
          <p className="font-sans font-medium text-sm mb-1" style={{ color: "#1C1814" }}>
            {alert.subject}
          </p>
          {alert.change && (
            <Link
              href={`/document/${alert.change.processed_document_id}`}
              className="font-mono text-xs hover:underline"
              style={{ color: "#C4855A" }}
            >
              View document →
            </Link>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          <button
            onClick={() => onFeedback(alert.id, "relevant")}
            className="p-1.5 rounded transition-colors"
            style={{ color: "#9E9890" }}
            title="Relevant"
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#7B9E87")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9E9890")}
          >
            <Check className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onFeedback(alert.id, "not_relevant")}
            className="p-1.5 rounded transition-colors"
            style={{ color: "#9E9890" }}
            title="Not relevant"
            onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#B85C5C")}
            onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#9E9890")}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
