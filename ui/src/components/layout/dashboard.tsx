import {
  BarChart3,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Search,
  Shield,
  Swords,
  Trophy,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";

import { Avatar } from "@/components/ui/avatar";
import { pages } from "@/lib/constant";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
}

const navSections: { title?: string; items: NavItem[] }[] = [
  {
    title: "Learning",
    items: [
      { to: pages.dashboard, label: "Dashboard", icon: LayoutDashboard },
      { to: pages.documents, label: "Classroom", icon: BookOpen },
      { to: pages.examHall, label: "Exam Hall", icon: Shield },
    ],
  },
  {
    title: "Compete",
    items: [
      { to: pages.challenges, label: "Challenges", icon: Swords },
      { to: pages.leaderboard, label: "Leaderboard", icon: Trophy },
    ],
  },
  {
    title: "Insights",
    items: [{ to: pages.analytics, label: "Analytics", icon: BarChart3 }],
  },
];

const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate(pages.home);
  };

  const SidebarContent = () => (
    <div className="flex select-none flex-col h-full">
      {/* Logo */}
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-6",
          sidebarCollapsed ? "justify-center px-2" : "",
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-700 shadow-sm flex-shrink-0">
          <GraduationCap className="h-6 w-6 text-white" />
        </div>
        {!sidebarCollapsed && (
          <span className="font-display text-xl font-bold text-primary-900 tracking-tight">
            NovaAcademy
          </span>
        )}
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {navSections.map((section, idx) => (
          <div key={idx}>
            {!sidebarCollapsed && section.title && (
              <h3 className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                {section.title}
              </h3>
            )}
            <div className="space-y-1">
              {section.items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === "/dashboard"}
                  onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                      isActive
                        ? "bg-primary-50 text-primary-700"
                        : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900",
                      sidebarCollapsed && "justify-center px-2",
                    )
                  }
                  title={sidebarCollapsed ? label : undefined}
                >
                  <Icon
                    className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors",
                      ({ isActive }: { isActive: boolean }) =>
                        isActive
                          ? "text-primary-600"
                          : "text-neutral-400 group-hover:text-neutral-600",
                    )}
                  />
                  {!sidebarCollapsed && <span>{label}</span>}

                  {/* Tooltip for collapsed state could go here */}
                </NavLink>
              ))}
            </div>
            {/* Divider */}
            {idx < navSections.length - 1 && (
              <div className="my-4 border-t border-neutral-100 mx-3" />
            )}
          </div>
        ))}
      </nav>

      {/* User section */}
      <div className="border-t border-neutral-200 p-4">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-neutral-50",
            sidebarCollapsed ? "justify-center" : "",
          )}
        >
          <Avatar
            src={user?.avatar_url ?? undefined}
            name={user?.first_name ?? "User"}
            size="sm"
          />
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-neutral-900 truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-neutral-500 truncate">{user?.email}</p>
            </div>
          )}
        </div>
        {!sidebarCollapsed && (
          <button
            onClick={handleLogout}
            className="mt-2 flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-500 hover:text-danger-600 hover:bg-danger-50 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col bg-white border-r border-neutral-200 transition-all duration-300 ease-in-out shadow-sm",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          sidebarCollapsed ? "w-20" : "w-64",
        )}
      >
        {/* Mobile Close button */}
        <button
          onClick={() => setSidebarOpen(false)}
          className="absolute right-3 top-5 rounded-md p-1 text-neutral-400 hover:text-neutral-600 lg:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="hidden lg:flex absolute -right-3 top-9 h-6 w-6 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-400 hover:text-primary-600 shadow-sm transition-colors z-50"
        >
          {sidebarCollapsed ? (
            <ChevronRight className="h-3 w-3" />
          ) : (
            <ChevronLeft className="h-3 w-3" />
          )}
        </button>

        <SidebarContent />
      </aside>

      {/* Main area */}
      <div
        className={cn(
          "transition-all duration-300 min-h-screen flex flex-col",
          sidebarCollapsed ? "lg:pl-20" : "lg:pl-64",
        )}
      >
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-neutral-200 bg-white/70 backdrop-blur">
          <div className="w-full max-w-[1400px] flex items-center justify-between mx-auto px-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
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
              {/* Action Buttons */}
              <Link
                to={pages.documents}
                className="hidden sm:flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-700 transition-all hover:shadow hover:-translate-y-0.5"
              >
                <BookOpen className="h-4 w-4" />
                <span>Study Now</span>
              </Link>

              <div className="h-8 w-px bg-neutral-200 hidden sm:block"></div>
              <Link
                to={pages.analytics}
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

        {/* Page content */}
        <main className="flex-1 w-full max-w-[1400px] mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile bottom tab bar - simplified */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-neutral-200 bg-white lg:hidden pb-safe">
        <div className="flex items-center justify-around">
          {[
            { to: pages.dashboard, icon: LayoutDashboard, label: "Home" },
            { to: pages.documents, icon: BookOpen, label: "Study" },
            { to: pages.examHall, icon: Shield, label: "Exam" },
            { to: pages.leaderboard, icon: Trophy, label: "Rank" },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === pages.dashboard}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 p-3 text-[10px] font-medium transition-colors",
                  isActive
                    ? "text-primary-600"
                    : "text-neutral-400 hover:text-neutral-600",
                )
              }
            >
              <Icon className="h-5 w-5" />
              {label}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default DashboardLayout;
