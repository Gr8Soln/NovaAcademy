import { AlertTriangle, CheckCircle, Lock } from "lucide-react";
import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/buttons";
import { Input } from "@/components/ui/inputs";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  if (score <= 1)
    return { label: "Weak", color: "bg-danger-500", width: "w-1/3" };
  if (score <= 3)
    return { label: "Medium", color: "bg-warning-500", width: "w-2/3" };
  return { label: "Strong", color: "bg-success-500", width: "w-full" };
}

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await authApi.resetPassword(token!, password);
      setSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  /* ── Invalid or missing token ──────────────────────────────────── */
  if (!token) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger-50">
          <AlertTriangle className="h-8 w-8 text-danger-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-primary-900 mb-2">
          Invalid reset link
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          This password reset link is invalid or has expired. Please request a
          new one.
        </p>
        <Link to="/auth/forgot-password">
          <Button>Request New Link</Button>
        </Link>
      </div>
    );
  }

  /* ── Success state ─────────────────────────────────────────────── */
  if (success) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
          <CheckCircle className="h-8 w-8 text-success-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-primary-900 mb-2">
          Password reset!
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Your password has been successfully reset. You can now log in with
          your new password.
        </p>
        <Link to="/auth/login">
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  /* ── Form ──────────────────────────────────────────────────────── */
  return (
    <div>
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
        <Lock className="h-7 w-7 text-primary-600" />
      </div>

      <h1 className="font-display text-2xl font-bold text-primary-900 text-center mb-1">
        Set new password
      </h1>
      <p className="text-center text-sm text-neutral-500 mb-8">
        Choose a strong password that you don't use elsewhere.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <Input
            label="New password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="At least 8 characters"
            required
            minLength={8}
          />
          {password && (
            <div className="mt-2">
              <div className="h-1.5 rounded-full bg-neutral-200 overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-300",
                    strength.color,
                    strength.width,
                  )}
                />
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                Password strength:{" "}
                <span className="font-medium">{strength.label}</span>
              </p>
            </div>
          )}
        </div>

        <Input
          label="Confirm new password"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat your password"
          required
          minLength={8}
          error={
            confirmPassword && password !== confirmPassword
              ? "Passwords do not match"
              : undefined
          }
        />

        <Button type="submit" fullWidth loading={loading}>
          Reset Password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Remember your password?{" "}
        <Link
          to="/auth/login"
          className="font-medium text-primary-500 hover:text-primary-700 transition-colors"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
