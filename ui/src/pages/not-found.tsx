import { Link } from "react-router-dom";

import { useAuthStore } from "@/stores";

export default function NotFoundPage() {
  const token = useAuthStore((s) => s.accessToken);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50 px-4">
      {/* Floating 404 illustration */}
      <div className="relative mb-8 select-none">
        <span className="text-[10rem] font-extrabold leading-none text-primary-100">
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center text-6xl animate-bounce">
          🎓
        </span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-3 text-center">
        Oops! Page not found
      </h1>
      <p className="text-gray-500 text-center max-w-md mb-8">
        Looks like you've wandered into uncharted territory. The page you're
        looking for doesn't exist or has been moved.
      </p>

      {/* Dynamic buttons based on auth state */}
      {token ? (
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/dashboard"
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 shadow-lg transition text-center"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/documents"
            className="px-8 py-3 bg-white text-primary-700 rounded-lg font-semibold border-2 border-primary-200 hover:border-primary-400 shadow-sm transition text-center"
          >
            My Documents
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/login"
            className="px-8 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 shadow-lg transition text-center"
          >
            Log In
          </Link>
          <Link
            to="/register"
            className="px-8 py-3 bg-white text-primary-700 rounded-lg font-semibold border-2 border-primary-200 hover:border-primary-400 shadow-sm transition text-center"
          >
            Create Account
          </Link>
          <Link
            to="/"
            className="px-8 py-3 text-gray-500 rounded-lg font-medium hover:text-gray-700 transition text-center"
          >
            Back to Home
          </Link>
        </div>
      )}

      {/* Fun decorative dots */}
      <div className="mt-12 flex gap-2">
        <span className="w-2 h-2 rounded-full bg-primary-300 animate-pulse" />
        <span className="w-2 h-2 rounded-full bg-primary-400 animate-pulse delay-75" />
        <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse delay-150" />
      </div>
    </div>
  );
}
