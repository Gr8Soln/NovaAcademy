import { Eye, EyeOff } from "lucide-react";
import {
  forwardRef,
  useState,
  type InputHTMLAttributes,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/lib/utils";

/* ─── Input ─────────────────────────────────────────────────── */

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, type, id, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === "password";
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            type={isPassword && showPassword ? "text" : type}
            className={cn(
              "w-full border border-neutral-200 rounded-xl px-4 py-3 font-sans text-base bg-white transition-all",
              "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
              "placeholder:text-neutral-400",
              icon && "pl-10",
              isPassword && "pr-10",
              error &&
                "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500",
              className,
            )}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              tabIndex={-1}
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";

/* ─── Textarea ──────────────────────────────────────────────── */

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            "w-full border border-neutral-200 rounded-xl px-4 py-3 font-sans text-base bg-white transition-all resize-none",
            "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
            "placeholder:text-neutral-400",
            error &&
              "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500",
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

/* ─── Checkbox ──────────────────────────────────────────────── */

export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> {
  label?: string | React.ReactNode;
  error?: string;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId =
      id ||
      (typeof label === "string"
        ? label.toLowerCase().replace(/\s+/g, "-")
        : undefined);

    return (
      <div className="w-full">
        <label
          htmlFor={inputId}
          className="flex items-start gap-2 cursor-pointer"
        >
          <input
            ref={ref}
            id={inputId}
            type="checkbox"
            className={cn(
              "mt-0.5 h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500/30",
              className,
            )}
            {...props}
          />
          {label && <span className="text-sm text-neutral-700">{label}</span>}
        </label>
        {error && <p className="mt-1 text-sm text-danger-500">{error}</p>}
      </div>
    );
  },
);

Checkbox.displayName = "Checkbox";

/* ─── Select ────────────────────────────────────────────────── */

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, options, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 mb-1.5"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={inputId}
          className={cn(
            "w-full border border-neutral-200 rounded-xl px-4 py-3 font-sans text-base bg-white transition-all",
            "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
            error &&
              "border-danger-500 focus:ring-danger-500/30 focus:border-danger-500",
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1.5 text-sm text-danger-500">{error}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
