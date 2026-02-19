import {
    ArrowLeft,
    BookOpen,
    ChevronDown,
    GraduationCap,
    LayoutDashboard,
    Library,
    MessageSquare,
    PenTool,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useParams } from "react-router-dom";

import { pages } from "@/lib/constant";
import { cn } from "@/lib/utils";

type TabKey = "overview" | "chat" | "library" | "study" | "quiz";

interface Tab {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  path: string; // relative route segment
}

function buildTabs(classId: string): Tab[] {
  const base = `/class/${classId}`;
  return [
    { key: "overview", label: "Overview", icon: LayoutDashboard, path: base },
    { key: "chat", label: "Chat", icon: MessageSquare, path: `${base}/chat` },
    {
      key: "library",
      label: "Library",
      icon: Library,
      path: `${base}/library`,
    },
    { key: "study", label: "Study", icon: BookOpen, path: `${base}/study` },
    { key: "quiz", label: "Quiz", icon: PenTool, path: `${base}/quiz` },
  ];
}

interface ClassLayoutProps {
  className?: string;
}

export default function ClassLayout({ className }: ClassLayoutProps) {
  const { classId } = useParams<{ classId: string }>();
  const tabs = buildTabs(classId ?? "");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className={cn("flex flex-col h-full min-h-0", className)}>
      {/* ── Desktop tabs ─────────────────────────────────── */}
      <div className="hidden sm:block border-b border-neutral-200 bg-white sticky top-0 z-10">
        <div className="flex items-center gap-1 px-4 md:px-6 max-w-[1400px] mx-auto">
          <Link
            to={pages.classroom}
            className="flex items-center gap-1.5 mr-2 py-3 text-neutral-400 hover:text-neutral-700 transition-colors"
            title="Back to Classroom"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2 mr-4 py-3">
            <GraduationCap className="h-5 w-5 text-primary-700" />
            <span className="font-display text-sm font-semibold text-neutral-900">
              Class
            </span>
          </div>

          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <NavLink
                key={tab.key}
                to={tab.path}
                end={tab.key === "overview"}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative",
                    isActive
                      ? "text-primary-700"
                      : "text-neutral-500 hover:text-neutral-900",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-700 rounded-t" />
                    )}
                  </>
                )}
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* ── Mobile dropdown ──────────────────────────────── */}
      <div className="sm:hidden border-b border-neutral-200 bg-white sticky top-0 z-10 px-4 py-2">
        <div className="flex items-center gap-2">
          <Link
            to={pages.classroom}
            className="flex items-center justify-center h-9 w-9 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-50 transition-colors"
            title="Back to Classroom"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-between flex-1 px-3 py-2.5 bg-neutral-50 rounded-lg text-sm font-medium text-neutral-900"
          >
            <div className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-primary-700" />
              Class Navigation
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-neutral-400 transition-transform",
                dropdownOpen && "rotate-180",
              )}
            />
          </button>
        </div>

        {dropdownOpen && (
          <div className="absolute left-4 right-4 mt-1 bg-white border border-neutral-200 rounded-lg shadow-lg overflow-hidden z-20">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <NavLink
                  key={tab.key}
                  to={tab.path}
                  end={tab.key === "overview"}
                  onClick={() => setDropdownOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 w-full px-4 py-3 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-600 hover:bg-neutral-50",
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </NavLink>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Route content ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto min-h-0">
        <Outlet />
      </div>
    </div>
  );
}

export type { TabKey };

