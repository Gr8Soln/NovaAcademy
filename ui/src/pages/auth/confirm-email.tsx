import { AlertTriangle, CheckCircle, Loader2, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/buttons";
import { authApi } from "@/lib/api/auth";
import { pages } from "@/lib/constant";

export default function ConfirmEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") ?? "";

  const [status, setStatus] = useState<"loading" | "success" | "error">(
    token ? "loading" : "error",
  );
  const [errorMessage, setErrorMessage] = useState(
    "This confirmation link is invalid or has expired.",
  );
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;
    authApi
      .confirmEmail(token)
      .then(() => setStatus("success"))
      .catch((err: Error) => {
        setErrorMessage(err.message || "Verification failed.");
        setStatus("error");
      });
  }, [token]);

  const handleResend = async () => {
    if (!email) return;
    setResending(true);
    try {
      await authApi.resendConfirmEmail(email);
      setResent(true);
    } catch {
      // silent — backend never leaks whether email exists
      setResent(true);
    } finally {
      setResending(false);
    }
  };

  /* ── Loading ──────────────────────────────────────────────────── */
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="text-sm text-neutral-500">Verifying your email…</p>
      </div>
    );
  }

  /* ── Success ──────────────────────────────────────────────────── */
  if (status === "success") {
    return (
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
          <CheckCircle className="h-8 w-8 text-success-600" />
        </div>
        <h1 className="font-display text-2xl font-bold text-primary-900 mb-2">
          Email confirmed!
        </h1>
        <p className="text-sm text-neutral-500 mb-8">
          Your email has been verified. You can now log in and start learning.
        </p>
        <Link to={pages.login}>
          <Button>Go to Login</Button>
        </Link>
      </div>
    );
  }

  /* ── Error ────────────────────────────────────────────────────── */
  return (
    <div className="text-center">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-danger-50">
        <AlertTriangle className="h-8 w-8 text-danger-600" />
      </div>
      <h1 className="font-display text-2xl font-bold text-primary-900 mb-2">
        Verification failed
      </h1>
      <p className="text-sm text-neutral-500 mb-8">{errorMessage}</p>

      {resent ? (
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success-50">
            <Mail className="h-6 w-6 text-success-600" />
          </div>
          <p className="text-sm text-neutral-600">
            A new verification email has been sent (if this address is
            registered).
          </p>
          <Link
            to={pages.login}
            className="text-sm text-primary-500 hover:text-primary-700"
          >
            Back to login
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {email && (
            <Button fullWidth loading={resending} onClick={handleResend}>
              Resend verification email
            </Button>
          )}
          <Link to={pages.login}>
            <Button variant="outline" fullWidth>
              Back to Login
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
