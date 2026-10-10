import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  AtSign,
  Camera,
  Check,
  CheckCircle,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Pencil,
  Trash2,
  User as UserIcon,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/inputs";
import { authApi } from "@/lib/api/auth";
import { useAuthStore } from "@/stores";
import type { User } from "@/types";

/* ─── Email verification banner ─────────────────────────────── */

function VerifyEmailBanner({ email }: { email: string }) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSend = async () => {
    setSending(true);
    setError("");
    try {
      await authApi.resendConfirmEmail(email);
      setSent(true);
    } catch (e) {
      setError((e as Error).message || "Failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-3">
        <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-success-600" />
        <div>
          <p className="text-sm font-semibold text-success-700">
            Verification email sent!
          </p>
          <p className="text-xs text-success-600 mt-0.5">
            Check your inbox at <span className="font-medium">{email}</span> and
            click the link to verify your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3">
      <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-warning-600" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-warning-700">
          Email not verified
        </p>
        <p className="text-xs text-warning-600 mt-0.5">
          Verify your email address to unlock all features.
        </p>
        {error && <p className="text-xs text-danger-500 mt-1">{error}</p>}
      </div>
      <button
        type="button"
        disabled={sending}
        onClick={handleSend}
        className="flex items-center gap-1.5 rounded-lg bg-warning-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-warning-700 transition-colors disabled:opacity-50 flex-shrink-0"
      >
        {sending ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Mail className="h-3.5 w-3.5" />
        )}
        {sending ? "Sending…" : "Verify email"}
      </button>
    </div>
  );
}

/* ─── helpers ───────────────────────────────────────────────── */

function FieldRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="mt-3 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-700">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-1">
          {label}
        </p>
        {children}
      </div>
    </div>
  );
}

/* ─── Avatar editor ─────────────────────────────────────────── */

function AvatarEditor({ user }: { user: User }) {
  const qc = useQueryClient();
  const { setAuth, accessToken, refreshToken } = useAuthStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const uploadMutation = useMutation({
    mutationFn: () => authApi.uploadAvatar(file!),
    onSuccess: (updated) => {
      setAuth(updated, accessToken!, refreshToken!);
      qc.invalidateQueries({ queryKey: ["me"] });
      setFile(null);
      setPreview(null);
    },
  });

  const removeMutation = useMutation({
    mutationFn: () => authApi.removeAvatar(),
    onSuccess: (updated) => {
      setAuth(updated, accessToken!, refreshToken!);
      qc.invalidateQueries({ queryKey: ["me"] });
    },
  });

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const fullName = `${user.first_name} ${user.last_name}`;
  const displaySrc = preview ?? user.avatar_url;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative">
        <Avatar
          name={fullName}
          src={displaySrc}
          size="xl"
          className="ring-4 ring-white shadow-lg"
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="absolute bottom-0 right-0 flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-white shadow-md hover:bg-primary-500 transition-colors"
        >
          <Camera className="h-4 w-4" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePick}
        />
      </div>

      {/* staged upload actions */}
      {file && (
        <div className="flex gap-2">
          <button
            type="button"
            title="Save photo"
            disabled={uploadMutation.isPending}
            onClick={() => uploadMutation.mutate()}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-white shadow-sm hover:bg-primary-500 transition-colors disabled:opacity-50"
          >
            {uploadMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
          </button>
          <button
            type="button"
            title="Cancel"
            onClick={() => {
              setFile(null);
              setPreview(null);
            }}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* remove existing avatar */}
      {!file && user.avatar_url && (
        <button
          type="button"
          title="Remove photo"
          disabled={removeMutation.isPending}
          onClick={() => removeMutation.mutate()}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-danger-200 bg-white text-danger-500 shadow-sm hover:bg-danger-50 hover:text-danger-600 transition-colors disabled:opacity-50"
        >
          {removeMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
      )}

      {uploadMutation.isError && (
        <p className="text-xs text-danger-500">
          {(uploadMutation.error as Error).message}
        </p>
      )}
    </div>
  );
}

/* ─── Info edit form ────────────────────────────────────────── */

function ProfileInfoForm({ user }: { user: User }) {
  const qc = useQueryClient();
  const { setAuth, accessToken, refreshToken } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setForm({
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
    });
  }, [user]);

  const mutation = useMutation({
    mutationFn: () => authApi.updateProfile(form),
    onSuccess: (updated) => {
      setAuth(updated, accessToken!, refreshToken!);
      qc.invalidateQueries({ queryKey: ["me"] });
      setEditing(false);
    },
    onError: (e: Error) => setErrors({ general: e.message }),
  });

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.first_name.trim()) errs.first_name = "Required";
    if (!form.last_name.trim()) errs.last_name = "Required";
    if (!form.email.trim()) errs.email = "Required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (validate()) mutation.mutate();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-800">Personal Information</h3>
        {!editing ? (
          <button
            type="button"
            title="Edit"
            onClick={() => setEditing(true)}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 hover:text-primary-600 transition-colors"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              title="Save"
              disabled={mutation.isPending}
              onClick={handleSave}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-white shadow-sm hover:bg-primary-500 transition-colors disabled:opacity-50"
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              title="Cancel"
              onClick={() => {
                setEditing(false);
                setErrors({});
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      {errors.general && (
        <p className="text-sm text-danger-500 bg-danger-50 rounded-lg px-4 py-2">
          {errors.general}
        </p>
      )}

      <FieldRow icon={<UserIcon className="h-4 w-4" />} label="First name">
        {editing ? (
          <Input
            value={form.first_name}
            onChange={(e) =>
              setForm((p) => ({ ...p, first_name: e.target.value }))
            }
            error={errors.first_name}
            placeholder="First name"
          />
        ) : (
          <p className="text-neutral-800 font-medium py-2">{user.first_name}</p>
        )}
      </FieldRow>

      <FieldRow icon={<UserIcon className="h-4 w-4" />} label="Last name">
        {editing ? (
          <Input
            value={form.last_name}
            onChange={(e) =>
              setForm((p) => ({ ...p, last_name: e.target.value }))
            }
            error={errors.last_name}
            placeholder="Last name"
          />
        ) : (
          <p className="text-neutral-800 font-medium py-2">{user.last_name}</p>
        )}
      </FieldRow>

      <FieldRow icon={<Mail className="h-4 w-4" />} label="Email">
        {editing ? (
          <Input
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            error={errors.email}
            placeholder="Email address"
          />
        ) : (
          <p className="text-neutral-800 font-medium py-2">{user.email}</p>
        )}
      </FieldRow>
    </div>
  );
}

/* ─── Username section ──────────────────────────────────────── */

function UsernameAndPasswordSection({ user }: { user: User }) {
  const qc = useQueryClient();
  const { setAuth, accessToken, refreshToken } = useAuthStore();
  const [usernameEditing, setUsernameEditing] = useState(false);
  const [usernameValue, setUsernameValue] = useState(user.username ?? "");
  const [usernameError, setUsernameError] = useState("");
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const hasPassword = user.has_password ?? user.auth_provider === "email";
  const [mode, setMode] = useState<"idle" | "set" | "change">("idle");
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    setUsernameValue(user.username ?? "");
  }, [user.username]);

  const lastChanged = user.username_changed_at
    ? new Date(user.username_changed_at)
    : null;
  const nextAllowed = lastChanged
    ? new Date(lastChanged.getTime() + 7 * 24 * 60 * 60 * 1000)
    : null;
  const canChange = !nextAllowed || new Date() >= nextAllowed;

  const usernameMutation = useMutation({
    mutationFn: () => authApi.updateUsername(usernameValue.trim()),
    onSuccess: (updated) => {
      setAuth(updated, accessToken!, refreshToken!);
      qc.invalidateQueries({ queryKey: ["me"] });
      setUsernameEditing(false);
      setUsernameSuccess(true);
      setUsernameError("");
    },
    onError: (e: Error) => setUsernameError(e.message),
  });

  const validateUsername = () => {
    const trimmed = usernameValue.trim();
    if (!trimmed) {
      setUsernameError("Username is required");
      return false;
    }
    if (!/^[A-Za-z_][A-Za-z0-9_]{2,14}$/.test(trimmed)) {
      setUsernameError(
        "3–15 chars · letters, digits, underscore · cannot start with a digit",
      );
      return false;
    }
    return true;
  };

  const handleSaveUsername = () => {
    if (validateUsername()) usernameMutation.mutate();
  };

  // ===== Password =========================

  const passwordMutation = useMutation({
    mutationFn: () =>
      hasPassword
        ? authApi.changePassword(form.current, form.next)
        : authApi.setPassword(form.next),
    onSuccess: () => {
      setPasswordSuccess(true);
      setMode("idle");
      setForm({ current: "", next: "", confirm: "" });
    },
    onError: (e: Error) => setPasswordErrors({ general: e.message }),
  });

  const validatePassword = () => {
    const errs: Record<string, string> = {};
    if (hasPassword && !form.current) errs.current = "Required";
    if (!form.next || form.next.length < 8) errs.next = "At least 8 characters";
    if (form.next !== form.confirm) errs.confirm = "Passwords don't match";
    setPasswordErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = () => {
    if (validatePassword()) passwordMutation.mutate();
  };

  const cancel = () => {
    setMode("idle");
    setPasswordErrors({});
    setForm({ current: "", next: "", confirm: "" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-neutral-800">Username & Password</h3>
        <div className="flex items-center justify-end gap-2">
          {!usernameEditing && canChange && (
            <button
              type="button"
              title="Change username"
              onClick={() => {
                setUsernameEditing(true);
                setUsernameSuccess(false);
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 hover:text-primary-600 transition-colors"
            >
              <Pencil className="h-4 w-4" />
            </button>
          )}

          {mode === "idle" && (
            <button
              type="button"
              title={hasPassword ? "Change password" : "Set password"}
              onClick={() => {
                setPasswordSuccess(false);
                setMode(hasPassword ? "change" : "set");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 hover:text-primary-600 transition-colors"
            >
              <KeyRound className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* display */}
      {!usernameEditing && (
        <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-50 text-primary-600">
            <AtSign className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-800">
              {user.username ? (
                <span className="font-mono">@{user.username}</span>
              ) : (
                <span className="text-neutral-400 italic">Not set</span>
              )}
            </p>
            {lastChanged && (
              <p className="text-xs text-neutral-500 mt-0.5">
                Last changed{" "}
                {lastChanged.toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
                {!canChange && nextAllowed && (
                  <>
                    {" "}
                    · next change available{" "}
                    {nextAllowed.toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </>
                )}
              </p>
            )}
          </div>
          {usernameSuccess && (
            <span className="ml-auto text-xs text-success-600 font-medium flex items-center gap-1 flex-shrink-0">
              <Check className="h-3.5 w-3.5" /> Updated
            </span>
          )}
        </div>
      )}

      {!usernameEditing && !canChange && (
        <p className="text-xs text-neutral-500 bg-neutral-50 rounded-lg px-4 py-2 border border-neutral-100">
          Usernames can only be changed once every 7 days.
        </p>
      )}

      {/* edit form */}
      {usernameEditing && (
        <div className="space-y-3 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
          {usernameError && (
            <p className="text-sm text-danger-500 bg-danger-50 rounded-lg px-4 py-2">
              {usernameError}
            </p>
          )}
          <Input
            label="New username"
            value={usernameValue}
            onChange={(e) => setUsernameValue(e.target.value)}
            placeholder="e.g. john_doe"
            autoComplete="off"
          />
          <p className="text-xs text-neutral-400">
            3–15 characters · letters, numbers, underscores · cannot start with
            a digit.
          </p>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              title="Save"
              disabled={usernameMutation.isPending}
              onClick={handleSaveUsername}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-white shadow-sm hover:bg-primary-500 transition-colors disabled:opacity-50"
            >
              {usernameMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              title="Cancel"
              onClick={() => {
                setUsernameEditing(false);
                setUsernameError("");
                setUsernameValue(user.username ?? "");
              }}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <hr className="flex-1 border-neutral-200" />

      {/* status badge */}
      {mode === "idle" && (
        <div className="flex items-center gap-3 rounded-xl border border-neutral-100 bg-neutral-50 px-4 py-3">
          <div
            className={`flex h-8 w-8 items-center justify-center rounded-full ${hasPassword ? "bg-success-100 text-success-600" : "bg-neutral-200 text-neutral-500"}`}
          >
            <Lock className="h-4 w-4" />
          </div>
          <div>
            <p className="text-sm font-medium text-neutral-800">
              {hasPassword ? "Password is set" : "No password set"}
            </p>
            <p className="text-xs text-neutral-500">
              {hasPassword
                ? "Your account is protected with a password."
                : user.auth_provider === "google"
                  ? "You signed in with Google. You can add a password too."
                  : "Add a password to log in without OAuth."}
            </p>
          </div>
          {passwordSuccess && (
            <span className="ml-auto text-xs text-success-600 font-medium flex items-center gap-1">
              <Check className="h-3.5 w-3.5" /> Updated
            </span>
          )}
        </div>
      )}

      {/* form */}
      {mode !== "idle" && (
        <div className="space-y-4 rounded-xl border border-neutral-100 bg-neutral-50 p-4">
          {passwordErrors.general && (
            <p className="text-sm text-danger-500 bg-danger-50 rounded-lg px-4 py-2">
              {passwordErrors.general}
            </p>
          )}

          {hasPassword && (
            <Input
              type="password"
              label="Current password"
              value={form.current}
              onChange={(e) =>
                setForm((p) => ({ ...p, current: e.target.value }))
              }
              error={passwordErrors.current}
              autoComplete="current-password"
            />
          )}

          <Input
            type="password"
            label={hasPassword ? "New password" : "Password"}
            value={form.next}
            onChange={(e) => setForm((p) => ({ ...p, next: e.target.value }))}
            error={passwordErrors.next}
            autoComplete="new-password"
          />

          <Input
            type="password"
            label="Confirm password"
            value={form.confirm}
            onChange={(e) =>
              setForm((p) => ({ ...p, confirm: e.target.value }))
            }
            error={passwordErrors.confirm}
            autoComplete="new-password"
          />

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              title={hasPassword ? "Update password" : "Set password"}
              disabled={passwordMutation.isPending}
              onClick={handleSubmit}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-700 text-white shadow-sm hover:bg-primary-500 transition-colors disabled:opacity-50"
            >
              {passwordMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              title="Cancel"
              onClick={cancel}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-white text-neutral-500 shadow-sm hover:bg-neutral-50 hover:text-neutral-700 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Account meta ──────────────────────────────────────────── */

function AccountMeta({ user }: { user: User }) {
  const joined = new Date(user.created_at).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const providerLabel: Record<string, string> = {
    google: "Google",
    email: "Email & Password",
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">
          Account ID
        </p>
        <p className="text-xs font-mono text-neutral-600 truncate">{user.id}</p>
      </div>
      <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">
          Member since
        </p>
        <p className="text-sm text-neutral-700 font-medium">{joined}</p>
      </div>
      <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">
          Sign-in method
        </p>
        <p className="text-sm text-neutral-700 font-medium">
          {providerLabel[user.auth_provider] ?? user.auth_provider}
        </p>
      </div>
      <div className="rounded-xl bg-neutral-50 border border-neutral-100 px-4 py-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400 mb-0.5">
          Status
        </p>
        <span
          className={`inline-flex items-center gap-1.5 text-sm font-medium ${user.is_active ? "text-success-600" : "text-danger-500"}`}
        >
          <span
            className={`h-2 w-2 rounded-full ${user.is_active ? "bg-success-500" : "bg-danger-500"}`}
          />
          {user.is_active ? "Active" : "Inactive"}
        </span>
      </div>
    </div>
  );
}

/* ─── Page ──────────────────────────────────────────────────── */

export default function ProfilePage() {
  const { user: storeUser } = useAuthStore();

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["me"],
    queryFn: () => authApi.me(),
    initialData: storeUser ?? undefined,
    staleTime: 30_000,
  });

  if (isLoading && !user) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
      </div>
    );
  }

  if (!user) return null;

  const fullName = `${user.first_name} ${user.last_name}`;

  return (
    <div className="space-y-6 pb-20 lg:pb-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-primary-900">
          My Profile
        </h1>
        <p className="text-neutral-500 mt-1">
          Manage your personal information and account security.
        </p>
      </div>

      {/* Email verification banner */}
      {!user.is_email_verified && <VerifyEmailBanner email={user.email} />}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left column */}
        <div className="space-y-6">
          {/* Avatar + name hero */}
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
              <AvatarEditor user={user} />
              <div className="text-center sm:text-left">
                <h2 className="font-display text-2xl font-bold text-primary-900">
                  {fullName}
                </h2>
                {user.username && (
                  <p className="text-sm font-mono text-primary-600 mt-0.5">
                    @{user.username}
                  </p>
                )}
                <p className="text-neutral-500 mt-0.5">{user.email}</p>
                <span className="mt-2 inline-flex items-center rounded-full bg-primary-50 px-3 py-0.5 text-xs font-semibold text-primary-700">
                  {user.auth_provider === "google"
                    ? "Google account"
                    : "Email account"}
                </span>
              </div>
            </div>
          </Card>

          {/* Account meta */}
          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent>
              <AccountMeta user={user} />
            </CardContent>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Personal info */}
          <Card>
            <CardContent>
              <ProfileInfoForm user={user} />
            </CardContent>
          </Card>

          {/* Username & Password */}
          <Card>
            <CardContent>
              <UsernameAndPasswordSection user={user} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
