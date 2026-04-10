"use client";

import { cn } from "@/lib/utils";
import type { ImpactLevel, ChangeType } from "@/lib/types";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "outline";
}

export function Badge({ children, className, variant = "default" }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-widest font-medium",
        variant === "outline" && "border",
        className
      )}
    >
      {children}
    </span>
  );
}

const IMPACT_STYLES: Record<ImpactLevel, string> = {
  high: "bg-impact-high/10 text-impact-high border border-impact-high/20",
  medium: "bg-impact-medium/10 text-impact-medium border border-impact-medium/20",
  low: "bg-impact-low/10 text-impact-low border border-impact-low/20",
};

export function ImpactBadge({ level }: { level: ImpactLevel }) {
  return (
    <Badge className={IMPACT_STYLES[level]}>
      {level}
    </Badge>
  );
}

const CHANGE_TYPE_LABELS: Record<string, string> = {
  proposed_rule: "Proposed Rule",
  final_rule: "Final Rule",
  amendment: "Amendment",
  enforcement_action: "Enforcement",
  guidance_update: "Guidance",
  guidance: "Guidance",
};

export function ChangeTypeBadge({ type }: { type: string }) {
  return (
    <Badge className="bg-white/5 text-text-secondary border border-border">
      {CHANGE_TYPE_LABELS[type] ?? type}
    </Badge>
  );
}
