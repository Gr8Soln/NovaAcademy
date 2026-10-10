import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/buttons";
import { Input } from "@/components/ui/inputs";
import { authApi } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSubmitted(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
          <Mail className="h-8 w-8 text-success-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-primary-900 mb-2">
          Check your email
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          We've sent a password reset link to{" "}
          <span className="font-medium text-neutral-700">{email}</span>. It may
          take a minute to arrive.
        </p>
        <Link to="/auth/login">
          <Button>Back to Login</Button>
        </Link>
        <p className="mt-4 text-xs text-neutral-400">
          Didn't receive the email?{" "}
          <button
            onClick={() => setSubmitted(false)}
            className="text-primary-500 hover:text-primary-700 underline"
          >
            Try again
          </button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
        <KeyRound className="h-7 w-7 text-primary-600" />
      </div>

      <h1 className="font-display text-2xl font-bold text-primary-900 text-center mb-1">
        Forgot your password?
      </h1>
      <p className="text-center text-sm text-neutral-500 mb-8">
        No worries! Enter your email and we'll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          required
        />

        <Button type="submit" fullWidth loading={loading}>
          Send Reset Link
        </Button>
      </form>

      <Link
        to="/auth/login"
        className="mt-6 flex items-center justify-center gap-1.5 text-sm text-neutral-500 hover:text-primary-600 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to login
      </Link>
    </div>
  );
}
