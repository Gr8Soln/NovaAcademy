import { Clock, GraduationCap, X } from "lucide-react";
import { Link, Outlet } from "react-router-dom";

const ImmersiveLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-neutral-50">
      {/* Immersive Header */}
      <header className="sticky top-0 z-50 h-16 bg-white border-b border-neutral-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between shadow-sm">
        {/* Left: Branding & Context */}
        <div className="flex items-center gap-4">
          <Link to="/dashboard" className="flex items-center gap-2 group">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-700 group-hover:bg-primary-600 transition-colors">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
          </Link>
          <div className="h-6 w-px bg-neutral-200" />
          <h1 className="text-sm font-semibold text-neutral-900">Exam Hall</h1>
        </div>

        {/* Center: Timer / Status (Placeholder for now, can be overridden by page portal) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full">
          <Clock className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-mono font-medium text-neutral-700">
            00:00:00
          </span>
        </div>

        {/* Right: Exit */}
        <Link
          to="/dashboard"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-neutral-500 hover:text-danger-600 hover:bg-danger-50 transition-colors"
        >
          <span>Exit</span>
          <X className="h-4 w-4" />
        </Link>
      </header>

      {/* Main Content - Centered & Focused */}
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8 flex flex-col">
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden min-h-[500px] flex flex-col">
          <Outlet />
        </div>
      </main>

      {/* Footer: Progress (Optional, can be portaled) */}
      <footer className="bg-white border-t border-neutral-200 py-3 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-xs text-neutral-400">
          <span>NovaAcademy Secure Browser</span>
          <span>ID: SESSION_123</span>
        </div>
      </footer>
    </div>
  );
};

export default ImmersiveLayout;
