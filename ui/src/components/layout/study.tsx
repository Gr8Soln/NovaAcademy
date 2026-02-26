import { googleLogout } from "@react-oauth/google";
import { Link, Outlet, useNavigate } from "react-router-dom";

import { pages } from "@/lib/constant";
import { useAuthStore } from "@/stores";

const StudyLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    googleLogout();
    navigate("/");
  };

  return (
    <div className="h-screen flex flex-col bg-neutral-50 overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 flex-shrink-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="text-xl font-bold text-primary-600 flex items-center gap-2"
            >
              🎓 <span className="hidden sm:inline">NovaAcademy</span>
            </Link>
            <nav className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-gray-500 hover:text-primary-600 transition"
              >
                Dashboard
              </Link>
              <Link
                to={pages.classroom}
                className="text-sm font-medium text-neutral-500 hover:text-primary-600 transition"
              >
                Classes
              </Link>
              <Link
                to={pages.documents}
                className="text-sm font-medium text-neutral-500 hover:text-primary-600 transition"
              >
                My Library
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end mr-2">
              <span className="text-xs font-bold text-gray-900 leading-none">
                {user?.first_name || "User"}
              </span>
              <span className="text-[10px] text-gray-400 font-medium">Study Mode</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs font-bold px-3 py-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content area: Fill remaining height and handle its own overflow */}
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
    </div>
  );
};

export default StudyLayout;
