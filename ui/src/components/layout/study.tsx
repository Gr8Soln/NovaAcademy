import { Link, Outlet, useNavigate } from "react-router-dom";

import { useAuthStore } from "@/stores";

const StudyLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-14">
          <div className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="text-xl font-bold text-primary-600"
            >
              🎓 NovaAcademy
            </Link>
            <nav className="hidden sm:flex items-center gap-4">
              <Link
                to="/dashboard"
                className="text-sm font-medium text-gray-500 hover:text-primary-600 transition"
              >
                Dashboard
              </Link>
              <Link
                to="/documents"
                className="text-sm font-medium text-gray-700 hover:text-primary-600 transition"
              >
                Documents
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 hidden sm:inline">
              {user?.full_name}
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:text-red-800 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-3 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} NovaAcademy. All rights reserved.
      </footer>
    </div>
  );
};

export default StudyLayout;
