import { BookOpen, GraduationCap } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

const images: Record<string, string> = {
  "/login":
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80",
  "/register":
    "https://images.unsplash.com/photo-1523050854058-8df90110c476?w=1200&q=80",
  "/forgot-password":
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=1200&q=80",
  "/reset-password":
    "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=1200&q=80",
};

const quotes: Record<string, { text: string; author: string }> = {
  "/login": {
    text: "Education is the most powerful weapon which you can use to change the world.",
    author: "Nelson Mandela",
  },
  "/register": {
    text: "The beautiful thing about learning is that nobody can take it away from you.",
    author: "B.B. King",
  },
  "/forgot-password": {
    text: "The only way to do great work is to love what you do.",
    author: "Steve Jobs",
  },
  "/reset-password": {
    text: "Live as if you were to die tomorrow. Learn as if you were to live forever.",
    author: "Mahatma Gandhi",
  },
};

const AuthLayout = () => {
  const { pathname } = useLocation();
  const image = images[pathname] || images["/login"];
  const quote = quotes[pathname] || quotes["/login"];

  return (
    <div className="min-h-screen flex">
      {/* ── Form Panel (left) ──────────────────────────────── */}
      <div className="w-full lg:w-1/2 flex flex-col bg-neutral-50">
        {/* Logo */}
        <header className="px-6 py-5 lg:px-8">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="flex items-center gap-1 text-primary-700 group-hover:text-primary-500 transition-colors">
              <BookOpen className="h-5 w-5" />
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="font-display text-xl font-bold text-primary-900">
              Gr8Academy
            </span>
          </Link>
        </header>

        {/* Centered form content */}
        <main className="flex-1 flex items-center justify-center px-6 py-8 lg:px-8">
          <div className="w-full max-w-md">
            <Outlet />
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 py-4 lg:px-8 text-center">
          <p className="text-xs text-neutral-400">
            &copy; {new Date().getFullYear()} Gr8Academy &mdash; Your Personal
            AI Tutor
          </p>
        </footer>
      </div>

      {/* ── Image Panel (right) ────────────────────────────── */}
      <div className="hidden lg:block lg:w-1/2 relative">
        <img
          src={image}
          alt="Academic"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-900/40 to-primary-900/20" />

        {/* Quote */}
        <div className="absolute bottom-0 left-0 right-0 p-10">
          <blockquote className="max-w-md">
            <p className="font-display text-xl text-white italic leading-relaxed">
              &ldquo;{quote.text}&rdquo;
            </p>
            <footer className="mt-3 font-sans text-sm text-neutral-300">
              &mdash; {quote.author}
            </footer>
          </blockquote>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
