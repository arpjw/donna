"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { UserButton } from "@clerk/nextjs";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { tasksApi } from "@/lib/api";
import { useTaskStats } from "@/lib/task-stats-context";

interface NavItem {
  href: string;
  label: string;
  dot: string;
  badgeKey?: "tasks";
}

const NAV_SECTIONS: { label: string; items: NavItem[] }[] = [
  {
    label: "Monitor",
    items: [
      { href: "/feed", label: "Feed", dot: "#C4855A" },
      { href: "/search", label: "Search", dot: "#7B9E87" },
    ],
  },
  {
    label: "Workflow",
    items: [
      { href: "/tasks", label: "Tasks", dot: "#D4893A", badgeKey: "tasks" },
      { href: "/calendar", label: "Calendar", dot: "#6B8CAE" },
    ],
  },
  {
    label: "Delivery",
    items: [
      { href: "/alerts", label: "Alerts", dot: "#B85C5C" },
      { href: "/digests", label: "Digests", dot: "#9B7FC7" },
    ],
  },
  {
    label: "Account",
    items: [{ href: "/settings", label: "Settings", dot: "#888780" }],
  },
];

// Flat list for collapsed icon tooltips
const ALL_ITEMS: NavItem[] = NAV_SECTIONS.flatMap((s) => s.items);

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

  return (
    <div className="flex flex-col h-full" style={{ background: "#1C1814" }}>
      {/* Wordmark */}
      <div
        className={cn(
          "flex flex-col h-14 px-4 border-b shrink-0 justify-center",
          collapsed ? "items-center" : "items-start"
        )}
        style={{ borderColor: "#2A2420" }}
      >
        {collapsed ? (
          <span
            className="font-display text-xl"
            style={{ color: "#C4855A" }}
          >
            D
          </span>
        ) : (
          <>
            <span
              className="font-display leading-none"
              style={{ fontSize: 22, color: "#F0EDE6" }}
            >
              Donn<em style={{ color: "#C4855A", fontStyle: "italic" }}>a</em>
            </span>
            <span
              className="font-mono uppercase tracking-widest"
              style={{ fontSize: 9, color: "#4A453F", letterSpacing: "0.1em", marginTop: 3 }}
            >
              Always three steps ahead.
            </span>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {collapsed ? (
          // Collapsed: show all items as dots with tooltips
          <div className="flex flex-col items-center gap-0.5 px-2">
            {ALL_ITEMS.map(({ href, label, dot, badgeKey }) => {
              const active = pathname === href || pathname.startsWith(href + "/");
              const count = badgeKey === "tasks" ? taskCount : 0;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onNavClick}
                  title={label}
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded transition-colors group",
                    active
                      ? "bg-[rgba(196,133,90,0.15)]"
                      : "hover:bg-[rgba(196,133,90,0.08)]"
                  )}
                >
                  <span
                    className="w-[7px] h-[7px] rounded-full shrink-0"
                    style={{ background: dot }}
                  />
                  {count > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center font-mono text-white"
                      style={{ background: "#C4855A", fontSize: 9 }}
                    >
                      {count > 9 ? "9+" : count}
                    </span>
                  )}
                  <span
                    className="absolute left-full ml-2 px-2 py-1 rounded text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50 pointer-events-none"
                    style={{ background: "#0E0B08", color: "#D4CFC7", border: "1px solid #2A2420" }}
                  >
                    {label}
                  </span>
                </Link>
              );
            })}
          </div>
        ) : (
          // Expanded: sections with labels
          <div className="space-y-4 px-3">
            {NAV_SECTIONS.map(({ label: sectionLabel, items }) => (
              <div key={sectionLabel}>
                <p
                  className="font-mono uppercase px-2 mb-1"
                  style={{ fontSize: 9, color: "#4A453F", letterSpacing: "0.1em" }}
                >
                  {sectionLabel}
                </p>
                <div className="space-y-0.5">
                  {items.map(({ href, label, dot, badgeKey }) => {
                    const active = pathname === href || pathname.startsWith(href + "/");
                    const count = badgeKey === "tasks" ? taskCount : 0;
                    return (
                      <Link
                        key={href}
                        href={href}
                        onClick={onNavClick}
                        className={cn(
                          "flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition-all duration-150 relative border-l-2",
                          active
                            ? "border-l-[#C4855A] pl-[6px]"
                            : "border-l-transparent pl-[6px] hover:bg-[rgba(196,133,90,0.06)]"
                        )}
                        style={
                          active
                            ? {
                                background:
                                  "linear-gradient(to right, rgba(196,133,90,0.12), transparent)",
                                color: "#F0EDE6",
                              }
                            : { color: "#6B655C" }
                        }
                      >
                        <span
                          className="w-[7px] h-[7px] rounded-full shrink-0"
                          style={{ background: dot }}
                        />
                        <span className="font-sans flex-1">{label}</span>
                        {count > 0 && (
                          <span
                            className="font-mono rounded-full px-1.5 py-0.5 leading-none text-white"
                            style={{ background: "#C4855A", fontSize: 9 }}
                          >
                            {count}
                          </span>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        className="border-t p-2 space-y-2 shrink-0"
        style={{ borderColor: "#2A2420" }}
      >
        <div
          className={cn(
            "flex items-center",
            collapsed ? "justify-center" : "px-2 gap-2.5"
          )}
        >
          {/* Gradient avatar dot */}
          <div
            className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center overflow-hidden"
            style={{
              background: "linear-gradient(135deg, #C4855A, #9B7FC7)",
            }}
          >
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-7 h-7",
                  userButtonTrigger: "focus:shadow-none",
                },
              }}
            />
          </div>
          {!collapsed && (
            <span className="font-sans truncate" style={{ fontSize: 11, color: "#6B655C" }}>
              Account
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          className="hidden md:flex items-center justify-center w-full py-1.5 rounded transition-colors"
          style={{ color: "#4A453F" }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#6B655C")}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = "#4A453F")}
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
  const { refreshKey } = useTaskStats();
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
  }, [getToken, refreshKey]);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("sidebar-collapsed", String(next));
  };

  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      {/* Mobile hamburger */}
      <button
        className="md:hidden fixed top-3.5 left-4 z-40 p-2 rounded transition-colors"
        style={{ color: "#6B655C" }}
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

      {/* Mobile drawer */}
      <aside
        className={cn(
          "md:hidden fixed top-0 left-0 h-full z-50 w-[196px] transition-transform duration-200",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ background: "#1C1814", borderRight: "1px solid #2A2420" }}
      >
        <button
          className="absolute top-3.5 right-3 p-1.5 rounded transition-colors"
          style={{ color: "#4A453F" }}
          onClick={closeMobile}
        >
          <X className="w-4 h-4" />
        </button>
        <SidebarContent
          collapsed={false}
          onToggle={closeMobile}
          onNavClick={closeMobile}
          taskCount={taskCount}
        />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen transition-all duration-200 shrink-0",
          collapsed ? "w-12" : "w-[196px]"
        )}
        style={{ background: "#1C1814", borderRight: "1px solid #2A2420" }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggle={toggle}
          taskCount={taskCount}
        />
      </aside>
    </>
  );
}
