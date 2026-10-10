import { Link } from "react-router-dom";

import { displayName, pages } from "@/lib/constant";
import { cn } from "@/lib/utils";

export const LogoWithName = ({
  to = pages.home,
  isWhite = false,
}: {
  to?: string;
  isWhite?: boolean;
}) => {
  return (
    <Link
      to={to}
      className={cn(
        "inline-flex items-center gap-2",
        isWhite ? "text-white" : "text-primary-700",
      )}
    >
      <div
        className={cn(
          "flex items-center gap-1",
          isWhite ? "text-white" : "text-primary-700",
        )}
      >
        <img src="/logo.png" className="h-6 w-6" alt="Nova Academy Logo" />
      </div>
      <span
        className={cn(
          "font-display text-xl font-bold",
          isWhite ? "text-white" : "text-primary-700",
        )}
      >
        {displayName}
      </span>
    </Link>
  );
};
