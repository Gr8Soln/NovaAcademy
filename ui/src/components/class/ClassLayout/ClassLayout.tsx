import {
  ArrowLeft,
  Bell,
  BookOpen,
  ChevronLeft,
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
import { displayName, pages } from "@/lib/constant";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";

type TabKey = "overview" | "chat" | "library" | "study" | "quiz";

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
  ];
}

// Mock class info for sidebar
const classInfo = {
  name: "Intro to Machine Learning",
  code: "ML-101",
  memberCount: 34,
  emoji: "🤖",
};

interface ClassLayoutProps {
  className?: string;
}

export default function ClassLayout({ className }: ClassLayoutProps) {
  const { classId } = useParams<{ classId: string }>();
  const navItems = buildNavItems(classId ?? "");
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  /** Shared sidebar content rendered in both desktop and mobile variants */
  const SidebarInner = ({ onClose }: { onClose?: () => void }) => (
    <>
      {/* Class header */}
      <div className="p-5 pb-4">
        <Link
          to={pages.classroom}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-neutral-400 hover:text-primary-600 transition-colors mb-4 uppercase tracking-widest"
        >
          <ChevronLeft className="h-3 w-3" />
          Classes
        </Link>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 text-2xl shadow-lg shadow-primary-500/25 ring-2 ring-primary-500/10">
            {classInfo.emoji}
          </div>
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
        </div>
      </div>

      <div className="mx-5 h-px bg-gradient-to-r from-transparent via-neutral-200 to-transparent" />

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-widest text-neutral-300">
          Navigate
        </p>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.key}
              to={item.path}
              end={item.key === "overview"}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 group relative",
                  isActive
                    ? "bg-primary-50/80 text-primary-700"
                    : "text-neutral-500 hover:bg-neutral-50 hover:text-neutral-700",
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary-600 rounded-r-full" />
                  )}
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-200",
                      isActive
                        ? "bg-gradient-to-br text-white shadow-sm " + item.color
                        : "bg-neutral-100/60 text-neutral-400 group-hover:bg-neutral-100 group-hover:text-neutral-600",
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1">{item.label}</span>
                  {item.badge && (
                    <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gradient-to-r from-primary-600 to-primary-500 px-1.5 text-[10px] font-bold text-white shadow-sm animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* AI Assistant hint */}
      <div className="mx-3 mb-3 rounded-xl bg-gradient-to-br from-primary-50 to-accent-50 border border-primary-100/50 p-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="h-4 w-4 text-primary-600" />
          <span className="text-xs font-bold text-primary-700">NovaAI</span>
        </div>
        <p className="text-[11px] text-primary-600/70 leading-relaxed">
          Tag <span className="font-semibold text-primary-700">@NovaAI</span> in
          chat for instant help with any topic.
        </p>
      </div>

      {/* Sidebar footer */}
      <div className="p-3 border-t border-neutral-100">
        <Link
          to={pages.classroom}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 transition-all"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Classroom
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
      <aside className="hidden lg:flex w-[260px] flex-shrink-0 flex-col bg-white border-r border-neutral-200/60 h-screen sticky top-0">
        <SidebarInner />
      </aside>

      {/* ── Main content area ─────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        {/* ── Top Navbar ──────────────────────────── */}
        <header className="flex items-center justify-between px-4 sm:px-6 h-14 bg-white border-b border-neutral-200/60 flex-shrink-0">
          {/* Left: mobile menu + brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMobileOpen(true)}
              className="rounded-xl p-2 -ml-2 text-neutral-500 hover:bg-neutral-100 transition-colors lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            {/* Brand */}
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-accent-600 shadow-sm">
                <Sparkles className="h-3.5 w-3.5 text-white" />
              </div>
              <span className="hidden sm:inline text-sm font-bold text-neutral-900 tracking-tight">
                {displayName}
              </span>
            </div>
          </div>

          {/* Right: search, bell, avatar */}
          <div className="flex items-center gap-1.5">
            <button className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
              <Search className="h-4 w-4" />
            </button>
            <button className="relative flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors">
              <Bell className="h-4 w-4" />
              <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-danger-500 ring-2 ring-white" />
            </button>
            <div className="ml-1">
              <Avatar
                name={user ? `${user.first_name} ${user.last_name}` : "User"}
                src={user?.avatar_url ?? undefined}
                size="sm"
                className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary-400 hover:ring-offset-1 transition-all"
              />
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
