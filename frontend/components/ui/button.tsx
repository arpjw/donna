"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-sans font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
          size === "sm" && "text-xs px-3 py-1.5 rounded",
          size === "md" && "text-sm px-4 py-2 rounded",
          size === "lg" && "text-base px-6 py-3 rounded",
          variant === "primary" &&
            "bg-crimson text-white hover:bg-crimson/90",
          variant === "secondary" &&
            "bg-card border border-border text-text-primary hover:bg-white/5",
          variant === "ghost" &&
            "text-text-secondary hover:text-text-primary hover:bg-white/5",
          variant === "outline" &&
            "border border-border text-text-primary hover:border-white/30",
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
