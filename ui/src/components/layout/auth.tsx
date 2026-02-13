import { Link, Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary-50 via-white to-blue-50">
      {/* Minimal header */}
      <header className="px-6 py-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xl font-bold text-primary-700 hover:text-primary-800 transition"
        >
          🎓 Gr8Academy
        </Link>
      </header>

      {/* Centered content area */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <Outlet />
      </main>

      {/* Subtle footer */}
      <footer className="py-4 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Gr8Academy &mdash; Your Personal AI
        Tutor
      </footer>
    </div>
  );
};

export default AuthLayout;
