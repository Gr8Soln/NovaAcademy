import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ClipboardCopy,
  Crown,
  Loader2,
  MoreVertical,
  Search,
  Shield,
  UserCheck,
  UserMinus,
  UserPlus,
  Users2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";

import { authApi } from "@/lib/api/auth";
import { classApi } from "@/lib/api/chat";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import type {
  ClassMember,
  ClassRole,
  ClassRoom,
  JoinRequest,
  User,
} from "@/types";

// ── Confirm dialog ──────────────────────────────────────────

function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  danger,
  isPending,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  danger?: boolean;
  isPending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />
      {/* Panel */}
      <div className="relative bg-white rounded-xl shadow-2xl border border-neutral-200 w-full max-w-sm mx-4 p-6">
        <div className="flex items-start gap-3 mb-4">
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full flex-shrink-0",
              danger ? "bg-red-100" : "bg-amber-100",
            )}
          >
            <AlertTriangle
              className={cn(
                "h-5 w-5",
                danger ? "text-red-600" : "text-amber-600",
              )}
            />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
            <p className="text-xs text-neutral-500 mt-1 leading-relaxed">
              {description}
            </p>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-xl transition-colors disabled:opacity-50",
              danger
                ? "bg-red-600 hover:bg-red-700"
                : "bg-primary-700 hover:bg-primary-600",
            )}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Role badge ───────────────────────────────────────────────

function RoleBadge({ role }: { role: ClassRole }) {
  if (role === "owner")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        <Crown className="h-3 w-3" />
        Owner
      </span>
    );
  if (role === "admin")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
        <Shield className="h-3 w-3" />
        Admin
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-600">
      Member
    </span>
  );
}

// ── Member row ───────────────────────────────────────────────

function MemberRow({
  member,
  isOwner,
  currentUserId,
  classCode,
}: {
  member: ClassMember;
  isOwner: boolean;
  currentUserId: string;
  classCode: string;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirm, setConfirm] = useState<
    "promote" | "demote" | "remove" | null
  >(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { mutate: changeRole, isPending: changingRole } = useMutation({
    mutationFn: (role: "admin" | "member") =>
      classApi.changeMemberRole(classCode, member.user_id, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", classCode] });
      setMenuOpen(false);
      setConfirm(null);
    },
  });

  const { mutate: removeMember, isPending: removing } = useMutation({
    mutationFn: () => classApi.removeMember(classCode, member.user_id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", classCode] });
      setMenuOpen(false);
      setConfirm(null);
    },
  });

  const isSelf = member.user_id === currentUserId;
  const canManage = isOwner && !isSelf && member.role !== "owner";

  const confirmConfig = {
    promote: {
      title: `Promote @${member.username} to Admin?`,
      description: "Admins can add/remove members and manage join requests.",
      confirmLabel: "Promote",
      danger: false,
      onConfirm: () => changeRole("admin"),
      isPending: changingRole,
    },
    demote: {
      title: `Demote @${member.username} to Member?`,
      description: "They will lose admin privileges immediately.",
      confirmLabel: "Demote",
      danger: false,
      onConfirm: () => changeRole("member"),
      isPending: changingRole,
    },
    remove: {
      title: `Remove @${member.username}?`,
      description:
        "They will be removed from this class and lose access to all class content.",
      confirmLabel: "Remove",
      danger: true,
      onConfirm: () => removeMember(),
      isPending: removing,
    },
  } as const;

  return (
    <>
      {confirm && (
        <ConfirmDialog
          open
          {...confirmConfig[confirm]}
          onCancel={() => setConfirm(null)}
        />
      )}
      <div className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 rounded-xl transition-colors group">
        {/* Avatar */}
        <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
          <span className="text-sm font-semibold text-primary-700">
            {member.username[0]?.toUpperCase() ?? "?"}
          </span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-neutral-900 truncate">
            @{member.username}
            {isSelf && (
              <span className="ml-1.5 text-xs text-neutral-400">(you)</span>
            )}
          </p>
          <p className="text-xs text-neutral-400">
            Joined {new Date(member.joined_at).toLocaleDateString()}
          </p>
        </div>

        {/* Role */}
        <RoleBadge role={member.role} />

        {/* Actions menu (owner only, not for self, not for other owner) */}
        {canManage && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((v) => !v)}
              disabled={changingRole || removing}
              className="h-7 w-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 opacity-0 group-hover:opacity-100 transition-all"
            >
              {changingRole || removing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreVertical className="h-4 w-4" />
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden">
                {member.role === "member" ? (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirm("promote");
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-50 text-neutral-700"
                  >
                    <Shield className="h-4 w-4 text-indigo-500" />
                    Promote to Admin
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      setConfirm("demote");
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-neutral-50 text-neutral-700"
                  >
                    <ChevronDown className="h-4 w-4 text-neutral-400" />
                    Demote to Member
                  </button>
                )}
                <div className="border-t border-neutral-100" />
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirm("remove");
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-red-50 text-red-600"
                >
                  <UserMinus className="h-4 w-4" />
                  Remove
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Join requests panel ──────────────────────────────────────

function JoinRequestsPanel({ classCode }: { classCode: string }) {
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery<JoinRequest[]>({
    queryKey: ["joinRequests", classCode],
    queryFn: () =>
      classApi.getJoinRequests(classCode) as Promise<JoinRequest[]>,
  });

  const { mutate: handleRequest, isPending } = useMutation({
    mutationFn: ({
      requestId,
      action,
    }: {
      requestId: string;
      action: "accept" | "reject";
    }) => classApi.handleJoinRequest(classCode, requestId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["joinRequests", classCode] });
      queryClient.invalidateQueries({ queryKey: ["class", classCode] });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (requests.length === 0) {
    return (
      <p className="text-sm text-neutral-400 px-4 py-4 text-center">
        No pending join requests.
      </p>
    );
  }

  return (
    <div className="divide-y divide-neutral-50">
      {requests.map((req) => (
        <div
          key={req.id}
          className="flex items-center gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors"
        >
          <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-amber-700">
              {req.username[0]?.toUpperCase() ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-neutral-900 truncate">
              @{req.username}
            </p>
            <p className="text-xs text-neutral-400">
              Requested {new Date(req.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() =>
                handleRequest({ requestId: req.id, action: "accept" })
              }
              disabled={isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-green-600 hover:bg-green-500 disabled:opacity-50 rounded-lg transition-colors"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Accept
            </button>
            <button
              onClick={() =>
                handleRequest({ requestId: req.id, action: "reject" })
              }
              disabled={isPending}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 disabled:opacity-50 rounded-lg transition-colors"
            >
              <X className="h-3.5 w-3.5" />
              Reject
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Add member panel ─────────────────────────────────────────

function AddMemberPanel({ classCode }: { classCode: string }) {
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim()), 300);
    return () => clearTimeout(t);
  }, [q]);

  const { data: searchResults, isFetching: searching } = useQuery<User[]>({
    queryKey: ["userSearch", debouncedQ],
    queryFn: () => authApi.searchUsers(debouncedQ) as Promise<User[]>,
    enabled: debouncedQ.length >= 1,
  });

  const { mutate: addMember, isPending: adding } = useMutation({
    mutationFn: (username: string) => classApi.addMember(classCode, username),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", classCode] });
      setQ("");
      setDebouncedQ("");
      setShowDropdown(false);
    },
  });

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        {searching && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 animate-spin" />
        )}
        <input
          ref={searchRef}
          type="text"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Search by username or name…"
          className={cn(
            "w-full pl-9 pr-4 border border-neutral-200 rounded-lg py-2.5 text-sm bg-white transition-all",
            "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
            "placeholder:text-neutral-400",
          )}
        />
      </div>

      {showDropdown && debouncedQ.length >= 1 && (
        <div
          ref={dropdownRef}
          className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden"
        >
          {(searchResults ?? []).length === 0 && !searching ? (
            <p className="px-4 py-3 text-sm text-neutral-400">No users found</p>
          ) : (
            (searchResults ?? []).slice(0, 6).map((u) => (
              <button
                key={u.id}
                type="button"
                disabled={adding}
                onClick={() => {
                  if (u.username) addMember(u.username);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50 transition-colors text-left"
              >
                <div className="h-7 w-7 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  {u.avatar_url ? (
                    <img
                      src={u.avatar_url}
                      alt=""
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-semibold text-primary-700">
                      {u.first_name[0]}
                    </span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {u.first_name} {u.last_name}
                  </p>
                  {u.username && (
                    <p className="text-xs text-neutral-500 truncate">
                      @{u.username}
                    </p>
                  )}
                </div>
                <UserPlus className="h-4 w-4 text-neutral-400 ml-auto flex-shrink-0" />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────

export default function ClassMembersPage() {
  const { classId: classCode } = useParams<{ classId: string }>();
  const currentUser = useAuthStore((s) => s.user);
  const [codeCopied, setCodeCopied] = useState(false);

  const {
    data: classRoom,
    isLoading,
    isError,
  } = useQuery<ClassRoom>({
    queryKey: ["class", classCode],
    queryFn: () => classApi.getClass(classCode!) as Promise<ClassRoom>,
    enabled: !!classCode,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-neutral-400" />
      </div>
    );
  }

  if (isError || !classRoom) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-sm text-red-500">Failed to load participants.</p>
      </div>
    );
  }

  const currentMember = classRoom.members.find(
    (m) => m.user_id === currentUser?.id,
  );
  const isOwner = currentMember?.role === "owner";
  const isAdmin = currentMember?.role === "admin" || isOwner;

  // Sort: owner → admin → member
  const roleOrder: Record<ClassRole, number> = {
    owner: 0,
    admin: 1,
    member: 2,
  };
  const sorted = [...classRoom.members].sort(
    (a, b) => roleOrder[a.role] - roleOrder[b.role],
  );

  function copyClassCode() {
    if (!classRoom) return;
    navigator.clipboard.writeText(classRoom.code);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2000);
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users2 className="h-5 w-5 text-neutral-400" />
            <h1 className="font-display text-xl font-bold text-neutral-900">
              Participants
            </h1>
          </div>
          <p className="text-sm text-neutral-500">
            {classRoom.member_count} member
            {classRoom.member_count !== 1 ? "s" : ""} in{" "}
            <span className="font-medium text-neutral-700">
              {classRoom.name}
            </span>
          </p>
        </div>
      </div>

      {/* Grid: two columns for admin/owner, single column otherwise */}
      <div
        className={cn("grid grid-cols-1 gap-6", isAdmin && "lg:grid-cols-5")}
      >
        {/* ── Left column (participants + class code) ── */}
        <div className={cn("space-y-5", isAdmin && "lg:col-span-3")}>
          {/* Class code card */}
          <div className="bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl border border-primary-100/50 p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-primary-600 mb-0.5">
                Class Code
              </p>
              <p className="font-mono text-lg font-bold text-primary-800 tracking-widest">
                {classRoom.code}
              </p>
              <p className="text-[11px] text-primary-500/70 mt-0.5">
                Share this code to invite others
              </p>
            </div>
            <button
              onClick={copyClassCode}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all",
                codeCopied
                  ? "bg-green-100 text-green-700"
                  : "bg-white text-primary-700 hover:bg-primary-100 border border-primary-200",
              )}
            >
              {codeCopied ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  Copied!
                </>
              ) : (
                <>
                  <ClipboardCopy className="h-3.5 w-3.5" />
                  Copy
                </>
              )}
            </button>
          </div>

          <div className="bg-white rounded-xl border border-neutral-200">
            <div className="px-4 py-3 border-b border-neutral-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users2 className="h-4 w-4 text-neutral-400" />
                <span className="text-sm font-semibold text-neutral-700">
                  All Participants
                </span>
              </div>
              <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                {sorted.length}
              </span>
            </div>
            <div className="divide-y divide-neutral-50">
              {sorted.map((member) => (
                <MemberRow
                  key={member.user_id}
                  member={member}
                  isOwner={isOwner}
                  currentUserId={currentUser?.id ?? ""}
                  classCode={classCode!}
                />
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column (admin/owner only) ── */}
        {isAdmin && (
          <div className="lg:col-span-2 space-y-5">
            {/* Add member */}
            <div className="bg-white rounded-xl border border-neutral-200 p-4">
              <p className="text-sm font-semibold text-neutral-700 mb-3 flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add a participant
              </p>
              <AddMemberPanel classCode={classCode!} />
            </div>

            {/* Join requests */}
            <div className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-amber-500" />
                <span className="text-sm font-semibold text-neutral-700">
                  Join Requests
                </span>
              </div>
              <JoinRequestsPanel classCode={classCode!} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
