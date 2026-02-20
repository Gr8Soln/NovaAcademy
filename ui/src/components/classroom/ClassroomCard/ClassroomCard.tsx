import { TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";

export interface ClassroomCardData {
  id: string;
  code: string;
  name: string;
  description: string;
  memberCount: number;
  progress: number; // 0-100
  subject: string;
  color?: string;
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

export default function ClassroomCard({
  classroom,
  className,
}: ClassroomCardProps) {
  const navigate = useNavigate();
  const g = getCardGradient(classroom.name);

  return (
    <div
      onClick={() => navigate(`/class/${classroom.code}`)}
      className={cn(
        "group relative bg-white rounded-2xl shadow-sm border border-neutral-200 overflow-hidden",
        "hover:shadow-lg hover:border-neutral-300 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
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
      </div>
    </div>
  );
}
