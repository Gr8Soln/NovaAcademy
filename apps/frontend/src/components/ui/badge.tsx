import { cn } from "@/lib/utils";

const variantStyles = {
  default: "bg-accent-500/10 text-accent-700",
  primary: "bg-primary-500/10 text-primary-700",
  success: "bg-success-500/10 text-success-700",
  warning: "bg-warning-500/10 text-warning-700",
  danger: "bg-danger-500/10 text-danger-700",
} as const;

export interface BadgeProps {
  children: React.ReactNode;
  variant?: keyof typeof variantStyles;
  className?: string;
}

export function Badge({
  children,
  variant = "default",
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-mono text-xs font-medium px-2 py-0.5 rounded-full",
        variantStyles[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
