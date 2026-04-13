"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "secondary", size = "md", style, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-sans font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none rounded",
          size === "sm" && "text-xs px-3 py-1.5",
          size === "md" && "text-sm px-4 py-2",
          size === "lg" && "text-base px-6 py-3",
          className
        )}
        style={{
          ...(variant === "primary"
            ? { background: "#C4855A", color: "#fff" }
            : variant === "secondary"
            ? { background: "#EEE9E0", border: "1px solid #D5D0C8", color: "#1C1814" }
            : variant === "ghost"
            ? { color: "#6B655C" }
            : { border: "1px solid #E2DDD5", color: "#1C1814" }),
          ...style,
        }}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
