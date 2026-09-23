import { useGoogleLogin } from "@react-oauth/google";
import { Mail } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/buttons";
import { Checkbox, Input } from "@/components/ui/inputs";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await authApi.login(email, password);
      setAuth(data.user, data.tokens.access_token, data.tokens.refresh_token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSubmit = async (tokenResponse: any) => {
    setGoogleLoading(true);
    try {
      const data = await authApi.googleAuth(
        tokenResponse.access_token,
        true,
      );
      setAuth(data.user, data.tokens.access_token, data.tokens.refresh_token);
      toast.success("Welcome back!");
      navigate("/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const loginWithGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => await handleGoogleSubmit(tokenResponse),
  });

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-primary-900 mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-neutral-500 mb-8">
        Log in to continue your learning journey
      </p>
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          required
        />

        <Input
          label="Password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Enter your password"
          required
        />

        <div className="flex items-center justify-between">
          <Checkbox label="Remember me" />
          <Link
            to="/auth/forgot-password"
            className="text-xs font-medium text-primary-500 hover:text-primary-700 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          disabled={googleLoading || loading}
        >
          Log In
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
      <Button
        variant="outline"
        fullWidth
        type="button"
        onClick={() => loginWithGoogle()}
        loading={googleLoading}
        disabled={googleLoading || loading}
      >
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
        Don&apos;t have an account?{" "}
        <Link
          to="/auth/register"
          className="font-medium text-primary-500 hover:text-primary-700 transition-colors"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
