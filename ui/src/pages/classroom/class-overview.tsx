import {
    BookOpen,
    Calendar,
    ChevronRight,
    Clock,
    FileText,
    GraduationCap,
    MessageSquare,
    PenTool,
    Sparkles,
    Target,
    TrendingUp,
    Trophy,
    Users,
    Zap,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

import { cn } from "@/lib/utils";

/* ── Mock class info ─────────────────────────────────────── */
const classInfo = {
  name: "Introduction to Machine Learning",
  instructor: "Prof. Wei Chen",
  schedule: "Mon & Wed, 10:00 – 11:30 AM",
  memberCount: 34,
  progress: 72,
  nextClass: "Tomorrow, 10:00 AM",
  description:
    "Learn the fundamentals of ML including supervised and unsupervised learning, neural networks, and model evaluation. Hands-on projects with real datasets.",
  stats: {
    studyHours: 24,
    quizzesTaken: 8,
    avgScore: 85,
    streak: 5,
  },
  announcements: [
    {
      id: "a1",
      title: "Midterm Exam — March 5",
      content: "The midterm will cover Weeks 1-6. Study guide available in Library.",
      date: "Feb 15, 2026",
      type: "urgent" as const,
    },
    {
      id: "a2",
      title: "Guest Lecture on Transformers",
      content: "Dr. Lisa Park will give a guest lecture on attention mechanisms this Wednesday.",
      date: "Feb 12, 2026",
      type: "info" as const,
    },
    {
      id: "a3",
      title: "Assignment 2 Released",
      content: "Neural network implementation due Feb 28. Check Library for starter code.",
      date: "Feb 10, 2026",
      type: "assignment" as const,
    },
  ],
  recentActivity: [
    { id: "r1", text: "Sarah Kim shared ML_Lecture_Notes.pdf", time: "2h ago", icon: FileText },
    { id: "r2", text: "Alex scored 95% on Neural Networks quiz", time: "4h ago", icon: Trophy },
    { id: "r3", text: "New study material added by Prof. Chen", time: "1d ago", icon: BookOpen },
  ],
};

const announcementColor = {
  urgent: "border-l-danger-500 bg-danger-50/30",
  info: "border-l-primary-500 bg-primary-50/30",
  assignment: "border-l-accent-500 bg-accent-50/30",
};

/** Overview page — shown at /class/:classId */
export default function ClassOverview() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const goTo = (section: string) => navigate(`/class/${classId}/${section}`);

  return (
    <div className="h-full overflow-y-auto">
    <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Left column (2/3) ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Class hero card */}
          <div className="relative bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white rounded-2xl p-6 md:p-8 overflow-hidden">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

            <div className="relative">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-sm shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-xl font-bold leading-tight">{classInfo.name}</h2>
                  <p className="text-sm text-primary-200">{classInfo.instructor}</p>
                </div>
              </div>

              <p className="text-sm text-primary-100/80 leading-relaxed mb-6 max-w-lg">
                {classInfo.description}
              </p>

              <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5 text-primary-200">
                  <Users className="h-4 w-4" />
                  <span>{classInfo.memberCount} students</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary-200">
                  <Clock className="h-4 w-4" />
                  <span>{classInfo.schedule}</span>
                </div>
                <div className="flex items-center gap-1.5 text-primary-200">
                  <Calendar className="h-4 w-4" />
                  <span>Next: {classInfo.nextClass}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Study Hours", value: classInfo.stats.studyHours, icon: Clock, color: "from-blue-500 to-indigo-500", suffix: "h" },
              { label: "Quizzes Taken", value: classInfo.stats.quizzesTaken, icon: PenTool, color: "from-pink-500 to-rose-500", suffix: "" },
              { label: "Avg Score", value: classInfo.stats.avgScore, icon: Target, color: "from-emerald-500 to-teal-500", suffix: "%" },
              { label: "Day Streak", value: classInfo.stats.streak, icon: Zap, color: "from-amber-500 to-orange-500", suffix: "🔥" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="bg-white rounded-2xl border border-neutral-200/60 p-4 hover:shadow-md hover:border-primary-200/50 transition-all group"
              >
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br text-white mb-2.5 shadow-sm", stat.color)}>
                  <stat.icon className="h-4 w-4" />
                </div>
                <p className="text-xl font-bold text-neutral-900">
                  {stat.value}{stat.suffix}
                </p>
                <p className="text-[11px] font-medium text-neutral-400 uppercase tracking-wider">{stat.label}</p>
              </div>
            ))}
          </div>

          {/* Announcements */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-neutral-900">Announcements</h3>
              <button className="text-xs font-medium text-primary-600 hover:text-primary-700 transition-colors">View all</button>
            </div>
            <div className="space-y-2.5">
              {classInfo.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={cn(
                    "bg-white rounded-xl border border-neutral-200/60 p-4 border-l-4 hover:shadow-sm transition-all",
                    announcementColor[ann.type],
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-bold text-neutral-900">{ann.title}</h4>
                      <p className="text-xs text-neutral-600 mt-0.5 leading-relaxed">{ann.content}</p>
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
            <h3 className="text-sm font-bold text-neutral-900 mb-3">Recent Activity</h3>
            <div className="bg-white rounded-xl border border-neutral-200/60 divide-y divide-neutral-100">
              {classInfo.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3.5 hover:bg-neutral-50/50 transition-colors">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-100 text-neutral-500 flex-shrink-0">
                    <activity.icon className="h-4 w-4" />
                  </div>
                  <p className="text-xs text-neutral-700 flex-1">{activity.text}</p>
                  <span className="text-[10px] text-neutral-400 flex-shrink-0">{activity.time}</span>
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
              <h3 className="text-sm font-bold text-neutral-900">Course Progress</h3>
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3.5 w-3.5 text-success-500" />
                <span className="text-xs font-bold text-success-500">+5%</span>
              </div>
            </div>
            {/* Circular progress */}
            <div className="flex justify-center mb-4">
              <div className="relative h-28 w-28">
                <svg className="h-28 w-28 transform -rotate-90" viewBox="0 0 120 120">
                  <circle cx="60" cy="60" r="50" fill="none" stroke="#f3f4f6" strokeWidth="10" />
                  <circle
                    cx="60"
                    cy="60"
                    r="50"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${classInfo.progress * 3.14} 314`}
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4f46e5" />
                      <stop offset="100%" stopColor="#7c3aed" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold text-neutral-900">{classInfo.progress}%</span>
                  <span className="text-[10px] text-neutral-400 font-medium">Complete</span>
                </div>
              </div>
            </div>
            <div className="text-center">
              <p className="text-xs text-neutral-500">Keep up the great work! 🚀</p>
            </div>
          </div>

          {/* Quick access */}
          <div className="bg-white rounded-2xl border border-neutral-200/60 p-5">
            <h3 className="text-sm font-bold text-neutral-900 mb-3">Quick Access</h3>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: BookOpen, label: "Study", emoji: "📖", route: "study", color: "from-violet-500 to-purple-500" },
                { icon: PenTool, label: "Quizzes", emoji: "📝", route: "quiz", color: "from-pink-500 to-rose-500" },
                { icon: MessageSquare, label: "Chat", emoji: "💬", route: "chat", color: "from-emerald-500 to-teal-500" },
                { icon: FileText, label: "Library", emoji: "📚", route: "library", color: "from-amber-500 to-orange-500" },
              ].map(({ label, emoji, route }) => (
                <button
                  key={label}
                  onClick={() => goTo(route)}
                  className="flex flex-col items-center gap-2 p-4 bg-neutral-50/50 rounded-xl border border-neutral-200/40 hover:shadow-md hover:border-primary-200/50 hover:-translate-y-0.5 transition-all cursor-pointer group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">{emoji}</span>
                  <span className="text-xs font-semibold text-neutral-700 group-hover:text-primary-700 transition-colors">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* AI tip card */}
          <div className="bg-gradient-to-br from-primary-50 via-accent-50/50 to-primary-50 rounded-2xl border border-primary-100/50 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary-600" />
              <span className="text-xs font-bold text-primary-700">NovaAI Suggestion</span>
            </div>
            <p className="text-xs text-primary-600/80 leading-relaxed mb-3">
              Based on your progress, you should review <strong>Neural Networks</strong> before the midterm. Try the practice quiz!
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
            <h3 className="text-sm font-bold text-neutral-900 mb-3">Upcoming</h3>
            <div className="space-y-3">
              {[
                { day: "Tomorrow", time: "10:00 AM", title: "Lecture: CNNs", type: "class" },
                { day: "Feb 22", time: "11:59 PM", title: "Assignment 2 Due", type: "deadline" },
                { day: "Mar 5", time: "10:00 AM", title: "Midterm Exam", type: "exam" },
              ].map((event, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn(
                    "flex h-10 w-10 flex-col items-center justify-center rounded-xl text-[10px] font-bold flex-shrink-0",
                    event.type === "exam" ? "bg-danger-50 text-danger-600" :
                    event.type === "deadline" ? "bg-accent-50 text-accent-600" :
                    "bg-primary-50 text-primary-600"
                  )}>
                    <Calendar className="h-3.5 w-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-900 truncate">{event.title}</p>
                    <p className="text-[10px] text-neutral-400">{event.day} · {event.time}</p>
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
