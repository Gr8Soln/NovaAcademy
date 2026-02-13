import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // TODO: Wire up to authApi.forgotPassword(email)
      // Simulate API call for now
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 text-center">
        {/* Success state */}
        <div className="mb-6">
          <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-3xl">
            ✉️
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">
          Check your email
        </h1>
        <p className="text-gray-500 text-sm mb-6">
          We've sent a password reset link to{" "}
          <span className="font-medium text-gray-700">{email}</span>. It may
          take a minute to arrive.
        </p>
        <Link
          to="/login"
          className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition"
        >
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8">
      {/* Icon */}
      <div className="text-center mb-6">
        <span className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary-100 text-3xl">
          🔑
        </span>
      </div>

      <h1 className="text-2xl font-bold text-center text-gray-900 mb-2">
        Forgot your password?
      </h1>
      <p className="text-center text-sm text-gray-500 mb-6">
        No worries! Enter your email and we'll send you a reset link.
      </p>

      {error && (
        <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="you@example.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 transition"
        >
          {loading ? "Sending..." : "Send Reset Link"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        Remember your password?{" "}
        <Link to="/login" className="text-primary-600 hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
