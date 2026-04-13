"use client";

import { cn } from "@/lib/utils";
import type { ImpactLevel, ChangeType } from "@/lib/types";

interface BadgeProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, className, style }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded font-mono uppercase tracking-widest font-medium",
        className
      )}
      style={{ fontSize: 9, letterSpacing: "0.08em", ...style }}
    >
      {children}
    </span>
  );
}

// Tinted badge system
const IMPACT_STYLES: Record<ImpactLevel, React.CSSProperties> = {
  high: {
    background: "#FAF0EC",
    border: "1px solid #E8C4BC",
    color: "#8B3A2F",
  },
  medium: {
    background: "#FDF4EA",
    border: "1px solid #E8D4BC",
    color: "#8B5E2F",
  },
  low: {
    background: "#EFF4ED",
    border: "1px solid #C4D8BC",
    color: "#3A6B3A",
  },
};

export function ImpactBadge({ level }: { level: ImpactLevel }) {
  return (
    <Badge style={IMPACT_STYLES[level]}>
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

const SOURCE_BADGE_STYLE: React.CSSProperties = {
  background: "#EDF0F5",
  border: "1px solid #C4D0DC",
  color: "#4A6A8B",
};

export function ChangeTypeBadge({ type }: { type: string }) {
  return (
    <Badge style={SOURCE_BADGE_STYLE}>
      {CHANGE_TYPE_LABELS[type] ?? type}
    </Badge>
  );
}

// Neutral badge
export const NEUTRAL_BADGE_STYLE: React.CSSProperties = {
  background: "#EEE9E0",
  border: "1px solid #D5D0C8",
  color: "#6B655C",
};
