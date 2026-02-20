import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, Loader2, LogOut, TrendingUp, UserPlus, Users } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { classApi } from "@/lib/api/chat";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";

export interface ClassroomCardData {
  id: string;
  code: string;
  name: string;
  description: string;
  memberCount: number;
  progress: number; // 0-100
  subject: string;
  color?: string;
  /** Whether the current user is already a member of this class */
  isMember?: boolean;
}

interface ClassroomCardProps {
  classroom: ClassroomCardData;
  className?: string;
}

/* ── Gradient palette ────────────────────────── */
const CARD_GRADIENTS = [
  {
    banner: "from-violet-500 to-indigo-700",
    progress: "bg-violet-500",
    progressTrack: "bg-violet-100",
    badge: "bg-violet-100 text-violet-700",
  },
  {
    banner: "from-emerald-500 to-teal-700",
    progress: "bg-emerald-500",
    progressTrack: "bg-emerald-100",
    badge: "bg-emerald-100 text-emerald-700",
  },
  {
    banner: "from-amber-500 to-orange-700",
    progress: "bg-amber-500",
    progressTrack: "bg-amber-100",
    badge: "bg-amber-100 text-amber-700",
  },
  {
    banner: "from-rose-500 to-pink-700",
    progress: "bg-rose-500",
    progressTrack: "bg-rose-100",
    badge: "bg-rose-100 text-rose-700",
  },
  {
    banner: "from-sky-500 to-blue-700",
    progress: "bg-sky-500",
    progressTrack: "bg-sky-100",
    badge: "bg-sky-100 text-sky-700",
  },
  {
    banner: "from-teal-500 to-cyan-700",
    progress: "bg-teal-500",
    progressTrack: "bg-teal-100",
    badge: "bg-teal-100 text-teal-700",
  },
  {
    banner: "from-fuchsia-500 to-purple-700",
    progress: "bg-fuchsia-500",
    progressTrack: "bg-fuchsia-100",
    badge: "bg-fuchsia-100 text-fuchsia-700",
  },
  {
    banner: "from-blue-500 to-indigo-700",
    progress: "bg-blue-500",
    progressTrack: "bg-blue-100",
    badge: "bg-blue-100 text-blue-700",
  },
] as const;

function hashName(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getCardGradient(name: string) {
  return CARD_GRADIENTS[hashName(name) % CARD_GRADIENTS.length];
}

/* ── Shared confirm modal ────────────────────── */
function ConfirmModal({
  open,
  onClose,
  title,
  body,
  confirmLabel,
  confirmClass,
  onConfirm,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  confirmClass: string;
  onConfirm: () => void;
  isPending: boolean;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-neutral-100 w-full max-w-sm mx-4 overflow-hidden animate-in fade-in-0 zoom-in-95">
        <div className="px-5 pt-5 pb-4">
          <h3 className="font-display text-base font-semibold text-neutral-900 mb-1.5">{title}</h3>
          <div className="text-sm text-neutral-500 leading-relaxed">{body}</div>
        </div>
        <div className="flex gap-2 justify-end px-5 py-3 bg-neutral-50 border-t border-neutral-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isPending}
            className="px-4 py-2 text-sm font-medium text-neutral-600 bg-white border border-neutral-200 hover:bg-neutral-50 rounded-xl transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              "inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold rounded-xl transition-colors disabled:opacity-50",
              confirmClass,
            )}
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isPending ? "Please wait…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClassroomCard({
  classroom,
  className,
}: ClassroomCardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const g = getCardGradient(classroom.name);

  // isMember defaults to true so existing "My Classes" cards always show Continue
  const isMember = classroom.isMember !== false;

  const [joinModal, setJoinModal] = useState(false);
  const [leaveModal, setLeaveModal] = useState(false);
  const [joinState, setJoinState] = useState<"idle" | "pending" | "joined" | "requested">("idle");
  const [leavePending, setLeavePending] = useState(false);

  const { mutate: joinClass } = useMutation({
    mutationFn: () => classApi.joinClass(classroom.code),
    onMutate: () => setJoinState("pending"),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["classSearch"] });
      setJoinModal(false);
      if (result.joined) {
        setJoinState("joined");
        setTimeout(() => navigate(`/class/${classroom.code}`), 600);
      } else {
        setJoinState("requested");
      }
    },
    onError: () => { setJoinState("idle"); setJoinModal(false); },
  });

  const { mutate: leaveClass } = useMutation({
    mutationFn: () => classApi.removeMember(classroom.code, currentUser!.id),
    onMutate: () => setLeavePending(true),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      queryClient.invalidateQueries({ queryKey: ["classSearch"] });
      setLeaveModal(false);
      setLeavePending(false);
    },
    onError: () => { setLeavePending(false); setLeaveModal(false); },
  });

  function handleCardClick() {
    if (isMember) navigate(`/class/${classroom.code}`);
  }

  return (
    <div
      onClick={handleCardClick}
      className={cn(
        "group relative bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden",
        isMember
          ? "hover:shadow-lg hover:border-neutral-300 hover:-translate-y-0.5 cursor-pointer"
          : "hover:shadow-md hover:border-neutral-300",
        "transition-all duration-200",
        className,
      )}
    >
      {/* ── Gradient banner ─────────────────── */}
      <div
        className={cn(
          "relative h-28 bg-gradient-to-br px-5 pt-4 pb-3 flex flex-col justify-between overflow-hidden",
          g.banner,
        )}
      >
        {/* Decorative blobs */}
        <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-white/10 pointer-events-none" />
        <div className="absolute -bottom-6 right-10 h-20 w-20 rounded-full bg-black/10 pointer-events-none" />

        {/* Subject badge */}
        <span className="self-start text-[10px] font-bold uppercase tracking-wider text-white/70 bg-white/15 px-2 py-0.5 rounded-full">
          {classroom.subject}
        </span>

        {/* Class name */}
        <div>
          <h3 className="font-display text-[15px] font-bold text-white leading-snug line-clamp-2 group-hover:text-white/95 transition-colors">
            {classroom.name}
          </h3>
        </div>
      </div>

      {/* ── Card body ───────────────────────── */}
      <div className="p-4">
        {/* Description */}
        <p className="text-[12.5px] text-neutral-500 line-clamp-2 leading-relaxed mb-4">
          {classroom.description}
        </p>

        {/* Progress */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-semibold text-neutral-500">
              Progress
            </span>
            <span
              className={cn(
                "text-[11px] font-bold px-1.5 py-0.5 rounded-full",
                g.badge,
              )}
            >
              {classroom.progress}%
            </span>
          </div>
          <div
            className={cn(
              "w-full h-1.5 rounded-full overflow-hidden",
              g.progressTrack,
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                g.progress,
              )}
              style={{ width: `${classroom.progress}%` }}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-[11.5px] text-neutral-400">
          <div className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            <span>{classroom.memberCount} members</span>
          </div>
          <div className="flex items-center gap-1 text-success-500 font-medium">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>Active</span>
          </div>
        </div>

        {/* CTA row */}
        <div className="mt-3.5 flex gap-2">
          {isMember ? (
            <>
              {/* Continue */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); navigate(`/class/${classroom.code}`); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-700 transition-colors"
              >
                Continue
                <ArrowRight className="h-3.5 w-3.5" />
              </button>

              {/* Leave */}
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setLeaveModal(true); }}
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-red-500 hover:bg-red-50 border border-neutral-200 hover:border-red-200 transition-colors"
                title="Leave class"
              >
                <LogOut className="h-3.5 w-3.5" />
                Leave
              </button>
            </>
          ) : joinState === "requested" ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700">
              Request sent
            </div>
          ) : joinState === "joined" ? (
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-green-50 text-green-700">
              Joined!
            </div>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setJoinModal(true); }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold bg-primary-700 hover:bg-primary-600 text-white transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Join Class
            </button>
          )}
        </div>
      </div>

      {/* ── Join confirm modal ─────────────────── */}
      <ConfirmModal
        open={joinModal}
        onClose={() => { if (joinState !== "pending") setJoinModal(false); }}
        title={`Join "${classroom.name}"?`}
        body={
          classroom.memberCount > 0
            ? `You'll be joining a class with ${classroom.memberCount} member${classroom.memberCount !== 1 ? "s" : ""}.`
            : "You'll be the first member of this class."
        }
        confirmLabel="Join Class"
        confirmClass="text-white bg-primary-700 hover:bg-primary-600"
        onConfirm={() => joinClass()}
        isPending={joinState === "pending"}
      />

      {/* ── Leave confirm modal ────────────────── */}
      <ConfirmModal
        open={leaveModal}
        onClose={() => { if (!leavePending) setLeaveModal(false); }}
        title={`Leave "${classroom.name}"?`}
        body="You'll lose access to this class and its content. You can rejoin later if it's public."
        confirmLabel="Yes, leave"
        confirmClass="text-white bg-red-500 hover:bg-red-600"
        onConfirm={() => leaveClass()}
        isPending={leavePending}
      />
    </div>
  );
}
