import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

import { cn } from "@/lib/utils";

const variantStyles = {
  primary:
    "bg-primary-700 hover:bg-primary-500 text-white font-semibold shadow-sm",
  accent:
    "bg-accent-500 hover:bg-accent-300 text-primary-900 font-semibold shadow-sm",
  ghost: "text-primary-700 hover:bg-primary-50 font-medium",
  danger:
    "bg-danger-500 hover:bg-danger-600 text-white font-semibold shadow-sm",
  outline:
    "border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-medium shadow-sm",
} as const;

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm rounded-md gap-1.5",
  md: "px-4 py-2.5 text-sm rounded-lg gap-2",
  lg: "px-6 py-3 text-base rounded-lg gap-2",
  // sm: "px-3 py-1.5 text-sm rounded-lg gap-1.5",
  // md: "px-4 py-2.5 text-sm rounded-xl gap-2",
  // lg: "px-6 py-3 text-base rounded-xl gap-2",
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variantStyles;
  size?: keyof typeof sizeStyles;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-sans transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500/30 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
