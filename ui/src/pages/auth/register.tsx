import { Mail, User } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/buttons";
import { Checkbox, Input } from "@/components/ui/inputs";
import { authApi } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import type { AuthResponse } from "@/types";

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

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms of Service");
      return;
    }

    setLoading(true);
    try {
      const data = (await authApi.register(
        email,
        fullName,
        password,
      )) as AuthResponse;
      setAuth(data.user, data.tokens.access_token, data.tokens.refresh_token);
      toast.success("Account created successfully!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-primary-900 mb-1">
        Create your account
      </h1>
      <p className="text-sm text-neutral-500 mb-8">
        Start your learning journey with AI-powered tools
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Full Name"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          placeholder="John Doe"
          icon={<User className="h-4 w-4" />}
          required
        />

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          required
        />

        <div>
          <Input
            label="Password"
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
          label="Confirm Password"
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

        <Checkbox
          checked={agreedToTerms}
          onChange={(e) =>
            setAgreedToTerms((e.target as HTMLInputElement).checked)
          }
          label={
            <span>
              I agree to the{" "}
              <a
                href="#"
                className="text-primary-500 hover:text-primary-700 underline"
              >
                Terms of Service
              </a>
            </span>
          }
        />

        <Button type="submit" fullWidth loading={loading}>
          Create Account
        </Button>
      </form>

      {/* Divider */}
      <div className="relative my-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-neutral-200" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-neutral-50 px-3 text-xs text-neutral-400">
            or continue with
          </span>
        </div>
      </div>

      {/* Google OAuth */}
      <Button variant="outline" fullWidth type="button">
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57a10.8 10.8 0 0 0 3.27-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.81 10.81 0 0 0 12 1 10.95 10.95 0 0 0 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        Continue with Google
      </Button>

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-medium text-primary-500 hover:text-primary-700 transition-colors"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
