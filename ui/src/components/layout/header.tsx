import {
  LayoutDashboard,
  LogOut,
  Menu,
  User,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/buttons";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import { displayName, pages } from "@/lib/constant";
import { LogoWithName } from "../ui";

interface HeaderProps {
  /** Transparent background that becomes solid on scroll */
  transparent?: boolean;
}

const Header = ({ transparent = false }: HeaderProps) => {
  const { user, logout } = useAuthStore();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    if (!transparent) return;
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [transparent]);

  const showSolid = !transparent || scrolled;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          showSolid
            ? "bg-white/95 backdrop-blur-md border-b border-neutral-200 shadow-sm"
            : "bg-transparent",
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
          {/* Logo */}
          <LogoWithName />

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
            >
              How It Works
            </a>
            <Link
              to={pages.leaderboard}
              className="text-sm font-medium text-neutral-700 hover:text-primary-600 transition-colors"
            >
              Leaderboard
            </Link>
          </nav>

          {/* Right side */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-full hover:ring-2 hover:ring-primary-200 transition-all p-0.5"
                >
                  <Avatar
                    name={user.full_name}
                    src={user.avatar_url}
                    size="sm"
                  />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-neutral-200 py-2 z-50">
                    <Link
                      to={pages.dashboard}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      to={pages.analytics}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
                      onClick={() => setProfileOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <hr className="my-1 border-neutral-100" />
                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-danger-500 hover:bg-neutral-50 w-full text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link to={pages.login}>
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to={pages.register}>
                  <Button variant="accent" size="sm">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 text-neutral-700 hover:bg-neutral-100 rounded-lg transition-colors"
          >
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-primary-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-72 bg-white shadow-xl p-6 flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-bold text-primary-900">
                {displayName}
              </span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1 text-neutral-500 hover:text-neutral-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col gap-3">
              <a
                href="#features"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-neutral-700 hover:text-primary-600 py-2"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-neutral-700 hover:text-primary-600 py-2"
              >
                How It Works
              </a>
              <Link
                to={pages.leaderboard}
                onClick={() => setMobileOpen(false)}
                className="text-sm font-medium text-neutral-700 hover:text-primary-600 py-2"
              >
                Leaderboard
              </Link>
            </nav>

            <div className="mt-auto flex flex-col gap-3">
              {user ? (
                <>
                  <Link to={pages.dashboard} onClick={() => setMobileOpen(false)}>
                    <Button variant="primary" fullWidth>
                      Dashboard
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    fullWidth
                    onClick={() => {
                      logout();
                      setMobileOpen(false);
                    }}
                  >
                    Logout
                  </Button>
                </>
              ) : (
                <>
                  <Link to={pages.login} onClick={() => setMobileOpen(false)}>
                    <Button variant="outline" fullWidth>
                      Log In
                    </Button>
                  </Link>
                  <Link to={pages.register} onClick={() => setMobileOpen(false)}>
                    <Button variant="accent" fullWidth>
                      Get Started
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
