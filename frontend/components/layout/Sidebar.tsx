"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import {
  LayoutList,
  Search,
  ClipboardList,
  Bell,
  BookOpen,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksApi } from "@/lib/api";

const NAV_ITEMS = [
  { href: "/feed", label: "Feed", icon: LayoutList },
  { href: "/search", label: "Search", icon: Search },
  { href: "/tasks", label: "Tasks", icon: ClipboardList, badgeKey: "tasks" as const },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/digests", label: "Digests", icon: BookOpen },
  { href: "/settings", label: "Settings", icon: Settings },
];

function SidebarContent({
  collapsed,
  onToggle,
  onNavClick,
  taskCount,
}: {
  collapsed: boolean;
  onToggle: () => void;
  onNavClick?: () => void;
  taskCount: number;
}) {
  const pathname = usePathname();

  const badges: Record<string, number> = {
    tasks: taskCount,
  };

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center h-14 px-4 border-b border-border shrink-0",
          collapsed ? "justify-center" : "justify-start"
        )}
      >
        {collapsed ? (
          <span className="text-crimson font-display text-xl font-semibold">D</span>
        ) : (
          <span className="text-text-primary font-display text-2xl font-semibold tracking-tight">
            Donna
          </span>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badgeKey }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          const count = badgeKey ? (badges[badgeKey] ?? 0) : 0;
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
              title={collapsed ? label : undefined}
              className={cn(
                "flex items-center gap-3 rounded px-2 py-2 text-sm transition-colors group relative",
                active
                  ? "text-text-primary border-l-2 border-crimson pl-[6px] bg-crimson/10"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5 border-l-2 border-transparent pl-[6px]"
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && (
                <span className="font-sans flex-1">{label}</span>
              )}
              {!collapsed && count > 0 && (
                <span className="ml-auto bg-crimson text-white text-[10px] font-mono rounded-full px-1.5 py-0.5 leading-none">
                  {count}
                </span>
              )}
              {collapsed && (
                <span className="absolute left-full ml-2 px-2 py-1 bg-card border border-border rounded text-xs text-text-primary whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none">
                  {label}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: user + collapse */}
      <div className="border-t border-border p-2 space-y-2 shrink-0">
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "px-2 gap-3"
          )}
        >
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-7 h-7",
                userButtonTrigger: "focus:shadow-none",
              },
            }}
          />
          {!collapsed && (
            <span className="text-xs text-text-tertiary font-sans truncate">
              Account
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="hidden md:flex items-center justify-center w-full py-1.5 rounded text-text-tertiary hover:text-text-secondary hover:bg-white/5 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
    </div>
  );
}

export function Sidebar() {
  const { getToken } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [taskCount, setTaskCount] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = await getToken();
        if (!token) return;
        const stats = await tasksApi.stats(token);
        setTaskCount(stats.open + stats.in_progress);
      } catch {
        // non-fatal
      }
    };
    fetchStats();
  }, [getToken]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        className="md:hidden fixed top-3.5 left-4 z-40 p-2 rounded text-text-secondary hover:text-text-primary hover:bg-white/5 transition-colors"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={closeMobile}
        />
      )}

      {/* Mobile sidebar drawer */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 h-full z-50 w-[220px] bg-shell border-r border-border transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          className="absolute top-3.5 right-3 p-1.5 rounded text-text-tertiary hover:text-text-secondary transition-colors"
          onClick={closeMobile}
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent collapsed={false} onToggle={closeMobile} onNavClick={closeMobile} taskCount={taskCount} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen bg-shell border-r border-border transition-all duration-200 shrink-0",
          collapsed ? "w-14" : "w-[220px]"
        )}
      >
        <SidebarContent collapsed={collapsed} onToggle={toggle} taskCount={taskCount} />
      </aside>
    </>
  );
}
