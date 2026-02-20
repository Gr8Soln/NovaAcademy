import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  BookOpen,
  Calendar,
  Check,
  ChevronRight,
  Clock,
  FileText,
  GraduationCap,
  Loader2,
  Lock,
  MessageSquare,
  Pencil,
  PenTool,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { Avatar } from "@/components/ui/avatar";
import { classApi } from "@/lib/api/chat";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import type { ClassRoom } from "@/types";

/* ── Mock data (non-API fields, to be replaced when backend supports them) ── */
const mockStats = {
  studyHours: 24,
  quizzesTaken: 8,
  avgScore: 85,
  streak: 5,
  progress: 72,
};
const mockAnnouncements = [
  {
    id: "a1",
    title: "Midterm Exam — March 5",
    content:
      "The midterm will cover Weeks 1-6. Study guide available in Library.",
    date: "Feb 15, 2026",
    type: "urgent" as const,
  },
  {
    id: "a2",
    title: "Guest Lecture on Transformers",
    content:
      "Dr. Lisa Park will give a guest lecture on attention mechanisms this Wednesday.",
    date: "Feb 12, 2026",
    type: "info" as const,
  },
  {
    id: "a3",
    title: "Assignment 2 Released",
    content:
      "Neural network implementation due Feb 28. Check Library for starter code.",
    date: "Feb 10, 2026",
    type: "assignment" as const,
  },
];

const mockRecentActivity = [
  {
    id: "r1",
    text: "Sarah Kim shared ML_Lecture_Notes.pdf",
    time: "2h ago",
    icon: FileText,
  },
  {
    id: "r2",
    text: "Alex scored 95% on Neural Networks quiz",
    time: "4h ago",
    icon: Trophy,
  },
  {
    id: "r3",
    text: "New study material added by Prof. Chen",
    time: "1d ago",
    icon: BookOpen,
  },
];

const announcementColor = {
  urgent: "border-l-danger-500 bg-danger-50/30",
  info: "border-l-primary-500 bg-primary-50/30",
  assignment: "border-l-accent-500 bg-accent-50/30",
};

/* ── Hero card gradient palette (mirrors ClassroomCard) ─── */
const HERO_GRADIENTS = [
  "from-violet-900 via-violet-800 to-indigo-700",
  "from-emerald-900 via-emerald-800 to-teal-700",
  "from-amber-900 via-amber-800 to-orange-700",
  "from-rose-900 via-rose-800 to-pink-700",
  "from-sky-900 via-sky-800 to-blue-700",
  "from-teal-900 via-teal-800 to-cyan-700",
  "from-fuchsia-900 via-fuchsia-800 to-purple-700",
  "from-blue-900 via-blue-800 to-indigo-700",
] as const;

function hashName(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getHeroGradient(name: string) {
  return HERO_GRADIENTS[hashName(name) % HERO_GRADIENTS.length];
}

/* ── Edit class modal ────────────────────────────── */
function EditClassModal({
  classRoom,
  classCode,
  onClose,
}: {
  classRoom: ClassRoom;
  classCode: string;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(classRoom.name);
  const [description, setDescription] = useState(classRoom.description ?? "");
  const [isPrivate, setIsPrivate] = useState(classRoom.is_private);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { mutate: updateClass, isPending } = useMutation({
    mutationFn: () =>
      classApi.updateClass(classCode, {
        name: name.trim(),
        description: description.trim() || undefined,
        is_private: isPrivate,
        image: imageFile ?? undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["class", classCode] });
      queryClient.invalidateQueries({ queryKey: ["classrooms"] });
      onClose();
    },
  });

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl border border-neutral-100 w-full max-w-md mx-4 overflow-hidden">
        {/* Modal header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100">
          <h3 className="font-display text-base font-semibold text-neutral-900">
            Edit Class
          </h3>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form body */}
        <div className="px-5 py-4 space-y-4">
          {/* Class image */}
          <div className="flex items-center gap-4">
            <div className="relative flex-shrink-0">
              {imagePreview || classRoom.avatar_url ? (
                <img
                  src={imagePreview ?? classRoom.avatar_url!}
                  alt=""
                  className="h-16 w-16 rounded-xl object-cover border border-neutral-200"
                />
              ) : (
                <div className="h-16 w-16 rounded-xl bg-neutral-100 flex items-center justify-center border border-neutral-200">
                  <span className="text-2xl">📚</span>
                </div>
              )}
              {imagePreview && (
                <button
                  type="button"
                  onClick={() => {
                    setImageFile(null);
                    setImagePreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute -top-1.5 -right-1.5 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-600 hover:text-primary-700 bg-neutral-100 hover:bg-primary-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <Upload className="h-3.5 w-3.5" />
                {imagePreview ? "Change image" : "Upload image"}
              </button>
              <p className="text-[11px] text-neutral-400 mt-1">
                JPG, PNG or WebP · max 5 MB
              </p>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
              Class Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter class name"
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none transition-all"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this class is about…"
              rows={3}
              className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm bg-white resize-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 focus:outline-none transition-all"
            />
          </div>

          {/* Private toggle */}
          <label className="flex items-center justify-between p-3 bg-neutral-50 rounded-xl border border-neutral-200 cursor-pointer select-none">
            <div>
              <p className="text-sm font-medium text-neutral-800">
                Private Class
              </p>
              <p className="text-xs text-neutral-500">
                New members must request to join
              </p>
            </div>
            <div
              className={cn(
                "relative w-10 h-5 rounded-full transition-colors",
                isPrivate ? "bg-primary-600" : "bg-neutral-300",
              )}
              onClick={() => setIsPrivate((v) => !v)}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform",
                  isPrivate && "translate-x-5",
                )}
              />
            </div>
          </label>
        </div>

        {/* Footer */}
        <div className="flex gap-2 justify-end px-5 py-4 border-t border-neutral-100 bg-neutral-50/50">
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
            onClick={() => updateClass()}
            disabled={!name.trim() || isPending}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-primary-700 hover:bg-primary-600 disabled:opacity-50 rounded-xl transition-colors"
          >
            {isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5" />
            )}
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
export default function ClassOverview() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((s) => s.user);
  const [editOpen, setEditOpen] = useState(false);

  const { data: classRoom, isLoading } = useQuery<ClassRoom>({
    queryKey: ["class", classId],
    queryFn: () => classApi.getClass(classId!) as Promise<ClassRoom>,
    enabled: !!classId,
  });

  const currentMember = classRoom?.members.find(
    (m) => m.user_id === currentUser?.id,
  );
  const canEdit =
    currentMember?.role === "owner" || currentMember?.role === "admin";

  const goTo = (section: string) => navigate(`/class/${classId}/${section}`);
  const heroGradient = getHeroGradient(classRoom?.name ?? classId ?? "");

  return (
    <div className="h-full overflow-y-auto">
      {editOpen && classRoom && (
        <EditClassModal
          classRoom={classRoom}
          classCode={classId!}
          onClose={() => setEditOpen(false)}
        />
      )}
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* ── Left column (2/3) ──────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Class hero card */}
            <div
              className={cn(
                "relative bg-gradient-to-br text-white rounded-2xl p-6 md:p-8 overflow-hidden",
                heroGradient,
              )}
            >
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

              <div className="relative">
                {/* Edit button — only for owner/admin */}
                {canEdit && classRoom && (
                  <button
                    onClick={() => setEditOpen(true)}
                    className="absolute top-0 right-0 inline-flex items-center gap-1.5 text-xs font-medium text-white/70 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1.5 rounded-lg transition-colors"
                  >
                    <Pencil className="h-3 w-3" />
                    Edit
                  </button>
                )}
                <div className="flex items-center gap-3 mb-4">
                  {/* Class avatar or fallback icon */}
                  {classRoom?.avatar_url ? (
                    <Avatar
                      src={classRoom.avatar_url}
                      name={classRoom.name}
                      size="md"
                      className="rounded-2xl shadow-lg"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
                      <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-display text-xl font-bold leading-tight text-white">
                      {isLoading ? (
                        <span className="inline-block h-5 w-48 bg-white/20 rounded animate-pulse" />
                      ) : (
                        (classRoom?.name ?? "Class")
                      )}
                    </h2>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-mono text-white/60 tracking-widest">
                        {classRoom?.code}
                      </span>
                      {classRoom?.is_private && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-white/70 bg-white/10 px-1.5 py-0.5 rounded-full">
                          <Lock className="h-2.5 w-2.5" /> Private
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="text-sm text-white/75 leading-relaxed mb-6 max-w-lg">
                  {isLoading ? (
                    <>
                      <span className="inline-block h-3 w-full bg-white/20 rounded animate-pulse mb-1.5" />
                      <span className="inline-block h-3 w-3/4 bg-white/20 rounded animate-pulse" />
                    </>
                  ) : (
                    classRoom?.description || (
                      <span className="italic text-white/40">
                        No description
                      </span>
                    )
                  )}
                </p>

                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Users className="h-4 w-4" />
                    <span>
                      {isLoading ? "…" : (classRoom?.member_count ?? 0)} member
                      {classRoom?.member_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-white/70">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created{" "}
                      {classRoom
                        ? new Date(classRoom.created_at).toLocaleDateString()
                        : "…"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: "Study Hours",
                  value: mockStats.studyHours,
                  icon: Clock,
                  color: "from-blue-500 to-indigo-500",
                  suffix: "h",
                },
                {
                  label: "Quizzes Taken",
                  value: mockStats.quizzesTaken,
                  icon: PenTool,
                  color: "from-pink-500 to-rose-500",
                  suffix: "",
                },
                {
                  label: "Avg Score",
                  value: mockStats.avgScore,
                  icon: Target,
                  color: "from-emerald-500 to-teal-500",
                  suffix: "%",
                },
                {
                  label: "Day Streak",
                  value: mockStats.streak,
                  icon: Zap,
                  color: "from-amber-500 to-orange-500",
                  suffix: "🔥",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="bg-white rounded-2xl border border-neutral-200/60 p-4 hover:shadow-md hover:border-primary-200/50 transition-all group"
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white mb-2.5 shadow-sm",
                      stat.color,
                    )}
                  >
                    <stat.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xl font-bold text-neutral-900">
                    {stat.value}
                    {stat.suffix}
                  </p>
                  <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>

            {/* Announcements */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-neutral-900">
                  Announcements
                </h3>
                <button className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">
                  View all
                </button>
              </div>
              <div className="space-y-2.5">
                {mockAnnouncements.map((ann) => (
                  <div
                    key={ann.id}
                    className={cn(
                      "bg-white rounded-xl border border-neutral-200/60 p-4 border-l-4 hover:shadow-sm transition-all",
                      announcementColor[ann.type],
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900">
                          {ann.title}
                        </h4>
                        <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">
                          {ann.content}
                        </p>
                      </div>
                      <span className="text-[10px] font-medium text-neutral-400 whitespace-nowrap bg-neutral-100 px-2 py-0.5 rounded-full">
                        {ann.date}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div>
              <h3 className="text-sm font-bold text-neutral-900 mb-3">
                Recent Activity
              </h3>
              <div className="bg-white rounded-xl border border-neutral-200/60 divide-y divide-neutral-100">
                {mockRecentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-3 p-3.5 hover:bg-neutral-50/50 transition-colors"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 flex-shrink-0">
                      <activity.icon className="h-4 w-4" />
                    </div>
                    <p className="text-xs text-neutral-700 flex-1">
                      {activity.text}
                    </p>
                    <span className="text-[10px] text-neutral-400 flex-shrink-0">
                      {activity.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right column (1/3) ─────────────────────────── */}
          <div className="space-y-5">
            {/* Progress card */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-neutral-900">
                  Course Progress
                </h3>
                <div className="flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-success-500" />
                  <span className="text-xs font-bold text-success-500">
                    +5%
                  </span>
                </div>
              </div>
              {/* Circular progress */}
              <div className="flex justify-center mb-4">
                <div className="relative h-28 w-28">
                  <svg
                    className="h-28 w-28 transform -rotate-90"
                    viewBox="0 0 120 120"
                  >
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="#f3f4f6"
                      strokeWidth="10"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="50"
                      fill="none"
                      stroke="url(#progressGradient)"
                      strokeWidth="10"
                      strokeLinecap="round"
                      strokeDasharray={`${mockStats.progress * 3.14} 314`}
                    />
                    <defs>
                      <linearGradient
                        id="progressGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="0%"
                      >
                        <stop offset="0%" stopColor="#4f46e5" />
                        <stop offset="100%" stopColor="#7c3aed" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-bold text-neutral-900">
                      {mockStats.progress}%
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      Complete
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-center">
                <p className="text-xs text-neutral-500">
                  Keep up the great work! 🚀
                </p>
              </div>
            </div>

            {/* Quick access */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 p-5">
              <h3 className="text-sm font-bold text-neutral-900 mb-3">
                Quick Access
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  {
                    icon: BookOpen,
                    label: "Study",
                    emoji: "📖",
                    route: "study",
                    color: "from-violet-500 to-purple-500",
                  },
                  {
                    icon: PenTool,
                    label: "Quizzes",
                    emoji: "📝",
                    route: "quiz",
                    color: "from-pink-500 to-rose-500",
                  },
                  {
                    icon: MessageSquare,
                    label: "Chat",
                    emoji: "💬",
                    route: "chat",
                    color: "from-emerald-500 to-teal-500",
                  },
                  {
                    icon: FileText,
                    label: "Library",
                    emoji: "📚",
                    route: "library",
                    color: "from-amber-500 to-orange-500",
                  },
                ].map(({ label, emoji, route }) => (
                  <button
                    key={label}
                    onClick={() => goTo(route)}
                    className="flex flex-col items-center gap-2 p-4 bg-neutral-50/50 rounded-xl border border-neutral-200/40 hover:shadow-md hover:border-primary-200/50 hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {emoji}
                    </span>
                    <span className="text-xs font-semibold text-neutral-700 group-hover:text-primary-700 transition-colors">
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* AI tip card */}
            <div className="bg-gradient-to-br from-primary-50 via-accent-50/50 to-primary-50 rounded-2xl border border-primary-100/50 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-primary-600" />
                <span className="text-xs font-bold text-primary-700">
                  NovaAI Suggestion
                </span>
              </div>
              <p className="text-xs text-primary-600/80 leading-relaxed mb-3">
                Based on your progress, you should review{" "}
                <strong>Neural Networks</strong> before the midterm. Try the
                practice quiz!
              </p>
              <button
                onClick={() => goTo("quiz")}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 hover:text-primary-600 transition-colors"
              >
                Take Practice Quiz
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>

            {/* Upcoming schedule */}
            <div className="bg-white rounded-2xl border border-neutral-200/60 p-5">
              <h3 className="text-sm font-bold text-neutral-900 mb-3">
                Upcoming
              </h3>
              <div className="space-y-3">
                {[
                  {
                    day: "Tomorrow",
                    time: "10:00 AM",
                    title: "Lecture: CNNs",
                    type: "class",
                  },
                  {
                    day: "Feb 22",
                    time: "11:59 PM",
                    title: "Assignment 2 Due",
                    type: "deadline",
                  },
                  {
                    day: "Mar 5",
                    time: "10:00 AM",
                    title: "Midterm Exam",
                    type: "exam",
                  },
                ].map((event, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className={cn(
                        "flex h-10 w-10 flex-col items-center justify-center rounded-xl text-[10px] font-bold flex-shrink-0",
                        event.type === "exam"
                          ? "bg-danger-50 text-danger-600"
                          : event.type === "deadline"
                            ? "bg-accent-50 text-accent-600"
                            : "bg-primary-50 text-primary-600",
                      )}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-900 truncate">
                        {event.title}
                      </p>
                      <p className="text-[10px] text-neutral-400">
                        {event.day} · {event.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
