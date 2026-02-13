import { cn } from "@/lib/utils";

/* ─── Card ──────────────────────────────────────────────────── */

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  /** Use primary gradient card style */
  featured?: boolean;
  onClick?: () => void;
}

export function Card({ children, className, featured, onClick }: CardProps) {
  if (featured) {
    return (
      <div
        className={cn(
          "bg-gradient-to-br from-primary-900 to-primary-700 text-white rounded-2xl shadow-lg p-8",
          onClick && "cursor-pointer",
          className,
        )}
        onClick={onClick}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 hover:shadow-md transition-shadow duration-200",
        onClick && "cursor-pointer",
        className,
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/* ─── Card Sub-components ───────────────────────────────────── */

export function CardHeader({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function CardContent({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn(className)}>{children}</div>;
}

export function CardFooter({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mt-4 pt-4 border-t border-neutral-200", className)}>
      {children}
    </div>
  );
}
