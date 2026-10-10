import { GraduationCap, Home, LogIn } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/buttons";
import { useAuthStore } from "@/stores";
import { pages } from "@/lib/constant";

export default function NotFoundPage() {
  const token = useAuthStore((s) => s.accessToken);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-neutral-50 px-4">
      {/* 404 */}
      <div className="relative mb-8 select-none">
        <span className="text-[10rem] font-extrabold leading-none text-primary-100/60">
          404
        </span>
        <span className="absolute inset-0 flex items-center justify-center">
          <GraduationCap className="h-16 w-16 text-primary-400 animate-bounce" />
        </span>
      </div>

      <h1 className="font-display text-3xl font-bold text-primary-900 mb-2 text-center">
        Page not found
      </h1>
      <p className="text-neutral-500 text-center max-w-md mb-8">
        The page you're looking for doesn't exist or has been moved.
      </p>

      {token ? (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link to={pages.dashboard}>
            <Button>
              <Home className="mr-1.5 h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
          <Link to={pages.documents}>
            <Button variant="outline">My Documents</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <Link to={pages.login}>
            <Button>
              <LogIn className="mr-1.5 h-4 w-4" />
              Log In
            </Button>
          </Link>
          <Link to={pages.home}>
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
