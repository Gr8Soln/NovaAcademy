import { Plus, Search, Users, X } from "lucide-react";
import { useState } from "react";

import ClassroomList from "@/components/classroom/ClassroomList";
import { cn } from "@/lib/utils";

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
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 animate-in fade-in-0 zoom-in-95">
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

export default function ClassroomPage() {
  const [joinOpen, setJoinOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [newGroup, setNewGroup] = useState({
    name: "",
    subject: "",
    description: "",
  });

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call backend
    alert(`Joining class with code: ${joinCode}`);
    setJoinCode("");
    setJoinOpen(false);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: call backend
    alert(`Creating group: ${newGroup.name}`);
    setNewGroup({ name: "", subject: "", description: "" });
    setCreateOpen(false);
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
            Create ChatGroup
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

      {/* ── Create ChatGroup Modal ───────────────────────────── */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a ChatGroup"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              ChatGroup Name
            </label>
            <input
              type="text"
              value={newGroup.name}
              onChange={(e) =>
                setNewGroup((g) => ({ ...g, name: e.target.value }))
              }
              placeholder="e.g., CS 301 Study ChatGroup"
              className={cn(
                "w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-sm bg-white transition-all",
                "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
                "placeholder:text-neutral-400",
              )}
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Subject
            </label>
            <input
              type="text"
              value={newGroup.subject}
              onChange={(e) =>
                setNewGroup((g) => ({ ...g, subject: e.target.value }))
              }
              placeholder="e.g., Computer Science"
              className={cn(
                "w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-sm bg-white transition-all",
                "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
                "placeholder:text-neutral-400",
              )}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Description
            </label>
            <textarea
              value={newGroup.description}
              onChange={(e) =>
                setNewGroup((g) => ({ ...g, description: e.target.value }))
              }
              placeholder="What will this group study?"
              rows={3}
              className={cn(
                "w-full border border-neutral-200 rounded-lg px-4 py-2.5 text-sm bg-white transition-all resize-none",
                "focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none",
                "placeholder:text-neutral-400",
              )}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setCreateOpen(false)}
              className="px-4 py-2 text-sm font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newGroup.name.trim() || !newGroup.subject.trim()}
              className="px-5 py-2 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-600 disabled:opacity-50 disabled:pointer-events-none rounded-lg transition-colors"
            >
              Create ChatGroup
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
