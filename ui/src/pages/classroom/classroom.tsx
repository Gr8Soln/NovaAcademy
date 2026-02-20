import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ImageIcon,
  Loader2,
  Plus,
  Search,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import ClassroomList from "@/components/classroom/ClassroomList";
import { authApi } from "@/lib/api/auth";
import { chatApi } from "@/lib/api/chat";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

// ── Modal shell ─────────────────────────────────────────────
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 animate-in fade-in-0 zoom-in-95 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg font-semibold text-neutral-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── Create class form ────────────────────────────────────────
function CreateClassModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<User[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search
  const [debouncedQ, setDebouncedQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(memberSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [memberSearch]);

  const { data: searchResults = [], isFetching: searching } = useQuery<User[]>({
    queryKey: ["userSearch", debouncedQ],
    queryFn: () => authApi.searchUsers(debouncedQ) as Promise<User[]>,
    enabled: debouncedQ.length >= 1,
  });

  const filteredResults = searchResults.filter(
    (u) => !selectedMembers.some((m) => m.id === u.id),
  );

  const { mutate: createGroup, isPending } = useMutation({
    mutationFn: () =>
      chatApi.createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        avatar_url: avatarUrl.trim() || undefined,
        is_private: isPrivate,
        initial_member_usernames: selectedMembers
          .map((m) => m.username)
          .filter(Boolean) as string[],
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      handleClose();
    },
  });

  function handleClose() {
    setName("");
    setDescription("");
    setAvatarUrl("");
    setIsPrivate(false);
    setMemberSearch("");
    setSelectedMembers([]);
    setShowDropdown(false);
    onClose();
  }

  function addMember(user: User) {
    setSelectedMembers((prev) => [...prev, user]);
    setMemberSearch("");
    setDebouncedQ("");
    setShowDropdown(false);
  }

  function removeMember(userId: string) {
    setSelectedMembers((prev) => prev.filter((m) => m.id !== userId));
  }

  // Close dropdown on outside click
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

  const canSubmit = name.trim().length >= 2 && !isPending;

  return (
    <Modal open={open} onClose={handleClose} title="Create a Classroom">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (canSubmit) createGroup();
        }}
        className="space-y-4"
      >
        {/* Name (required) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Class Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., CS 301 Study Group"
            maxLength={80}
            className={cn(
              "w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-sm bg-white transition-all",
              "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
              "placeholder:text-neutral-400",
            )}
            autoFocus
          />
        </div>

        {/* Description (optional) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Description{" "}
            <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will this classroom focus on?"
            rows={2}
            maxLength={400}
            className={cn(
              "w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-sm bg-white transition-all resize-none",
              "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
              "placeholder:text-neutral-400",
            )}
          />
        </div>

        {/* Cover image URL (optional) */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Cover Image URL{" "}
            <span className="text-neutral-400 font-normal">(optional)</span>
          </label>
          <div className="relative">
            <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
            <input
              type="url"
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/image.png"
              className={cn(
                "w-full pl-9 pr-4 border border-neutral-200 rounded-lg py-2.5 text-sm bg-white transition-all",
                "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
                "placeholder:text-neutral-400",
              )}
            />
          </div>
        </div>

        {/* Privacy toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            className={cn(
              "relative w-9 h-5 rounded-full transition-colors",
              isPrivate ? "bg-primary-600" : "bg-neutral-300",
            )}
            onClick={() => setIsPrivate((v) => !v)}
          >
            <span
              className={cn(
                "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                isPrivate && "translate-x-4",
              )}
            />
          </div>
          <span className="text-sm text-neutral-700">Private classroom</span>
        </label>

        {/* Add students */}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1.5">
            Add Students{" "}
            <span className="text-neutral-400 font-normal">(optional)</span>
          </label>

          {/* Selected pills */}
          {selectedMembers.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {selectedMembers.map((m) => (
                <span
                  key={m.id}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-50 text-primary-700 text-xs font-medium"
                >
                  {m.username ?? `${m.first_name} ${m.last_name}`}
                  <button
                    type="button"
                    onClick={() => removeMember(m.id)}
                    className="hover:text-primary-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Search input */}
          <div className="relative">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              {searching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 animate-spin" />
              )}
              <input
                ref={searchRef}
                type="text"
                value={memberSearch}
                onChange={(e) => {
                  setMemberSearch(e.target.value);
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

            {/* Dropdown results */}
            {showDropdown && debouncedQ.length >= 1 && (
              <div
                ref={dropdownRef}
                className="absolute z-10 mt-1 w-full bg-white border border-neutral-200 rounded-xl shadow-lg overflow-hidden"
              >
                {filteredResults.length === 0 && !searching ? (
                  <p className="px-4 py-3 text-sm text-neutral-400">
                    No users found
                  </p>
                ) : (
                  filteredResults.slice(0, 6).map((u) => (
                    <button
                      key={u.id}
                      type="button"
                      onClick={() => addMember(u)}
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
                      <div className="min-w-0">
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
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Check className="h-4 w-4" />
            )}
            {isPending ? "Creating…" : "Create Classroom"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// ── Page ─────────────────────────────────────────────────────
export default function ClassroomPage() {
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: implement join by code
    alert(`Joining class with code: ${joinCode}`);
    setJoinCode("");
    setJoinOpen(false);
  };

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-neutral-900">
            My Classrooms
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            View and manage your enrolled classes
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          <button
            onClick={() => setJoinOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg bg-primary-700 text-white hover:bg-primary-600 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Join Class
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg border border-primary-700 text-primary-700 hover:bg-primary-50 transition-colors"
          >
            <Users className="h-4 w-4" />
            Create Class
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
        <input
          type="text"
          placeholder="Search classrooms…"
          className="w-full pl-9 pr-4 py-2.5 text-sm border border-neutral-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 transition-all"
        />
      </div>

      {/* Classroom grid */}
      <ClassroomList />

      {/* ── Join Class Modal ─────────────────────────────── */}
      <Modal
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Join a Class"
      >
        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Class Code
            </label>
            <input
              type="text"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              placeholder="Enter the class invite code"
              className={cn(
                "w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-sm bg-white transition-all",
                "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
                "placeholder:text-neutral-400",
              )}
              autoFocus
            />
            <p className="text-xs text-neutral-400 mt-1.5">
              Ask your instructor or group admin for the code.
            </p>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setJoinOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors"
            >
              Join
            </button>
          </div>
        </form>
      </Modal>

      {/* ── Create Class Modal ───────────────────────────── */}
      <CreateClassModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
      />
    </div>
  );
}
