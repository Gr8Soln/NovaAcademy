import { useAuthStore } from "@/stores/authStore";
import { Link, Outlet, useNavigate } from "react-router-dom";

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          <Link to="/dashboard" className="text-xl font-bold text-primary-600">
            🎓 Gr8Academy
          </Link>
          <nav className="flex items-center gap-6">
            <Link
              to="/dashboard"
              className="text-sm font-medium text-gray-700 hover:text-primary-600"
            >
              Dashboard
            </Link>
            <Link
              to="/documents"
              className="text-sm font-medium text-gray-700 hover:text-primary-600"
            >
              Documents
            </Link>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-500">{user?.full_name}</span>
              <button
                onClick={handleLogout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Logout
              </button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t py-4 text-center text-sm text-gray-500">
        &copy; 2026 Gr8Academy. All rights reserved.
      </footer>
    </div>
  );
}
