import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  Library,
  Menu,
  MessageSquare,
  PenTool,
  Search,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";

import { Avatar } from "@/components/ui/avatar";
import { classApi } from "@/lib/api/chat";
import { pages } from "@/lib/constant";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import type { ClassRoom } from "@/types";

type TabKey =
  | "overview"
  | "chat"
  | "library"
  | "study"
  | "quiz"
  | "participants";

interface NavItem {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  path: string;
  badge?: string;
  color: string;
}

function buildNavItems(classId: string): NavItem[] {
  const base = `/class/${classId}`;
  return [
    {
      key: "overview",
      label: "Overview",
      icon: LayoutDashboard,
      path: base,
      color: "from-blue-500 to-indigo-500",
    },
    {
      key: "chat",
      label: "Chat",
      icon: MessageSquare,
      path: `${base}/chat`,
      badge: "3",
      color: "from-emerald-500 to-teal-500",
    },
    {
      key: "library",
      label: "Library",
      icon: Library,
      path: `${base}/library`,
      color: "from-amber-500 to-orange-500",
    },
    {
      key: "study",
      label: "Study",
      icon: BookOpen,
      path: `${base}/study`,
      color: "from-violet-500 to-purple-500",
    },
    {
      key: "quiz",
      label: "Quiz",
      icon: PenTool,
      path: `${base}/quiz`,
      color: "from-pink-500 to-rose-500",
    },
    {
      key: "participants",
      label: "Participants",
      icon: Users,
      path: `${base}/participants`,
      color: "from-cyan-500 to-sky-500",
    },
  ];
}

interface ClassLayoutProps {
  className?: string;
}

export default function ClassLayout({ className }: ClassLayoutProps) {
  const { classId: classCode } = useParams<{ classId: string }>();
  const navItems = buildNavItems(classCode ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { data: classRoom } = useQuery<ClassRoom>({
    queryKey: ["class", classCode],
    queryFn: () => classApi.getClass(classCode!) as Promise<ClassRoom>,
    enabled: !!classCode,
  });

  const classInfo = {
    name: classRoom?.name ?? "Loading…",
    code: classRoom?.code ?? "…",
    memberCount: classRoom?.member_count ?? 0,
    emoji: classRoom?.avatar_url ? "" : "📚",
    avatarUrl: classRoom?.avatar_url ?? null,
  };

  /** Shared sidebar content rendered in both desktop and mobile variants */
  const SidebarInner = ({
    onClose,
    collapsed = false,
  }: {
    onClose?: () => void;
    collapsed?: boolean;
  }) => (
    <>
      {/* Class header */}
      <div
        className={cn(
          "p-4 pb-3 flex flex-col",
          collapsed ? "items-center" : "",
        )}
      >
        {!collapsed && (
          <Link
            to={pages.classroom}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-primary-600 transition-colors mb-4 uppercase tracking-widest self-start"
          >
            <ChevronLeft className="h-3 w-3" />
            Classes
          </Link>
        )}
        <div
          className={cn(
            "flex items-center gap-3",
            collapsed ? "justify-center" : "",
          )}
        >
          <Link
            to={pages.classroom}
            title={collapsed ? "Back to Classes" : undefined}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-2xl shadow-lg shadow-primary-500/25 ring-2 ring-primary-500/10 flex-shrink-0 overflow-hidden"
          >
            {classInfo.avatarUrl ? (
              <img
                src={classInfo.avatarUrl}
                alt=""
                className="h-11 w-11 object-cover"
              />
            ) : (
              classInfo.emoji
            )}
          </Link>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="font-display text-[15px] font-bold text-neutral-900 truncate leading-tight">
                {classInfo.name}
              </h2>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-neutral-400">
                <span className="font-mono text-neutral-500">
                  {classInfo.code}
                </span>
                <span className="text-neutral-200">·</span>
                <div className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {classInfo.memberCount}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!collapsed && (
        <div className="mx-5 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />
      )}

      {/* Navigation */}
      <nav
        className={cn(
          "flex-1 overflow-y-auto py-4 space-y-0.5",
          collapsed ? "px-2" : "px-3",
        )}
      >
        {!collapsed && (
          <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-300">
            Navigate
          </p>
        )}
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.key === "overview"}
              onClick={onClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
                  collapsed ? "justify-center p-2.5" : "px-3 py-2.5",
                  isActive
                    ? "bg-primary-50/80 text-primary-700"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && !collapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-600 rounded-r-full" />
                  )}
                  <div
                    className={cn(
                      "flex items-center justify-center rounded-lg transition-all duration-200",
                      collapsed ? "h-9 w-9" : "h-8 w-8",
                      isActive
                        ? "bg-gradient-to-br text-white shadow-sm " + item.color
                        : "bg-neutral-100/60 text-neutral-400 group-hover:bg-neutral-100 group-hover:text-neutral-600",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-1.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {collapsed && item.badge && (
                    <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary-500" />
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* AI Assistant hint — hidden when collapsed */}
      {!collapsed && (
        <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100/50 p-3.5">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-4 w-4 text-primary-600" />
            <span className="text-xs font-bold text-primary-700">NovaAI</span>
          </div>
          <p className="text-[11px] text-primary-600/70 leading-relaxed">
            Tag <span className="font-semibold text-primary-700">@NovaAI</span>{" "}
            in chat for instant help with any topic.
          </p>
        </div>
      )}

      {/* Sidebar footer */}
      <div
        className={cn(
          "p-3 border-t border-neutral-100",
          collapsed ? "flex justify-center" : "",
        )}
      >
        <Link
          to={pages.classroom}
          title={collapsed ? "Back to Classroom" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-xl text-[13px] font-medium text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all",
            collapsed ? "p-2.5" : "px-3 py-2.5",
          )}
        >
          <ArrowLeft className="h-4 w-4 flex-shrink-0" />
          {!collapsed && "Back to Classroom"}
        </Link>
      </div>
    </>
  );

  return (
    <div
      className={cn("flex h-screen bg-neutral-50 overflow-hidden", className)}
    >
      {/* ── Mobile overlay ────────────────────────────── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Mobile sidebar (fixed overlay, lg:hidden) ─── */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[260px] bg-white border-r border-neutral-200/60 flex flex-col shadow-2xl transition-transform duration-300 ease-out lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setMobileOpen(false)}
          className="absolute right-3 top-4 rounded-xl p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
        <SidebarInner onClose={() => setMobileOpen(false)} />
      </aside>

      {/* ── Desktop sidebar (static flex child, hidden on mobile) ── */}
      <aside
        className={cn(
          "hidden lg:flex flex-shrink-0 flex-col bg-white border-r border-neutral-200/60 h-screen top-0 relative transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-[64px]" : "w-[260px]",
        )}
      >
        {/* Collapse toggle button */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-16 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-neutral-200 text-neutral-400 hover:text-neutral-700 hover:border-neutral-300 shadow-sm transition-all"
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>
        <SidebarInner collapsed={sidebarCollapsed} />
      </aside>

      {/* ── Main content area ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* ── Top Navbar ──────────────────────────── */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-neutral-200 bg-white/70 backdrop-blur">
          <div className="w-full max-w-[1400px] flex items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-md p-2 text-neutral-500 hover:bg-neutral-100 lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>

            {/* Search Bar */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-neutral-100/50 rounded-lg border border-transparent focus-within:border-primary-200 focus-within:bg-white focus-within:ring-2 focus-within:ring-primary-100 transition-all w-full max-w-md">
              <div className="flex-1 flex items-center gap-2 ">
                <Search className="h-4 w-4 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Search for documents, students, or topics..."
                  className="bg-transparent border-none focus:outline-none text-sm text-neutral-700 placeholder:text-neutral-400 w-full"
                />
              </div>
              <span className="hidden lg:inline-flex items-center rounded border border-neutral-200 bg-white p-1 font-mono text-[9px] font-medium text-neutral-500">
                Ctrl K
              </span>
            </div>

            <div className="flex-1" />

            <div className="flex items-center gap-3 sm:gap-4">
              <Link
                to={pages.profile}
                className="hidden sm:flex items-center gap-2 hover:opacity-80 transition-opacity"
              >
                <Avatar
                  src={user?.avatar_url ?? undefined}
                  name={user?.first_name ?? "User"}
                  size="sm"
                  className="ring-2 ring-white shadow-sm"
                />
              </Link>
            </div>
          </div>
        </header>

        {/* Page content — each page manages its own overflow */}
        <div className="flex-1 overflow-hidden min-h-0">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export type { TabKey };
