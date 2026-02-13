import { GraduationCap } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";

const images: Record<string, string> = {
  "/login":
    "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&q=80",
  "/register":
    "https://images.unsplash.com/photo-1513258496099-48168024aec0?w=1200&q=80",
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
    <div className="min-h-screen relative flex flex-col items-center justify-center">
      {/* ── Full Background Image with Blur ──────────────── */}
      <img
        src={image}
        alt="Academic"
        className="absolute inset-0 w-full h-full object-cover blur-sm scale-105"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-primary-900/50" />

      {/* ── Form Panel (centered) ────────────────────────── */}
      <div className="relative z-10 w-full max-w-xl flex flex-col px-6 py-8">
        {/* Logo */}
        <header className="mb-6 text-center">
          <Link to="/" className="inline-flex items-center gap-2 group">
            <div className="flex items-center gap-1 text-white/90 group-hover:text-white transition-colors">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Gr8Academy
            </span>
          </Link>
        </header>

        {/* Form content */}
        <main className="bg-white/95 backdrop-blur-sm rounded-2xl px-8 py-10">
          <Outlet />
        </main>

        {/* Quote */}
        <div className="mt-8 text-center">
          <blockquote className="max-w-md mx-auto">
            <p className="font-display text-lg text-white italic leading-relaxed">
              &ldquo;{quote.text}&rdquo;
            </p>
            <footer className="mt-2 font-sans text-sm text-neutral-300">
              &mdash; {quote.author}
            </footer>
          </blockquote>
        </div>

        {/* Footer */}
        <footer className="mt-6 text-center">
          <p className="text-xs text-neutral-300/70">
            &copy; {new Date().getFullYear()} Gr8Academy &mdash; Your Personal
            AI Tutor
          </p>
        </footer>
      </div>
    </div>
  );
};

export default AuthLayout;
