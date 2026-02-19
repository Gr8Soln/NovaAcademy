import { BarChart3, BookOpen, Clock, GraduationCap, Users } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";

// ── Mock class info ─────────────────────────────────────────
const classInfo = {
  name: "Introduction to Machine Learning",
  instructor: "Prof. Wei Chen",
  schedule: "Mon & Wed, 10:00 – 11:30 AM",
  memberCount: 34,
  progress: 72,
  description:
    "Learn the fundamentals of ML including supervised and unsupervised learning, neural networks, and model evaluation. Hands-on projects with real datasets.",
  announcements: [
    {
      id: "a1",
      title: "Midterm Exam — March 5",
      content:
        "The midterm will cover Weeks 1-6. Study guide available in Library.",
      date: "Feb 15, 2026",
    },
    {
      id: "a2",
      title: "Guest Lecture on Transformers",
      content:
        "Dr. Lisa Park will give a guest lecture on attention mechanisms this Wednesday.",
      date: "Feb 12, 2026",
    },
  ],
};

/** Overview page — shown at /class/:classId */
export default function ClassOverview() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();

  const goTo = (section: string) => navigate(`/class/${classId}/${section}`);

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ── Left column (2/3) ──────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">
          {/* Class header card */}
          <div className="bg-gradient-to-br from-primary-900 to-primary-700 text-white rounded-2xl p-6 md:p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="font-display text-xl font-bold">
                  {classInfo.name}
                </h2>
                <p className="text-sm text-primary-200">
                  {classInfo.instructor}
                </p>
              </div>
            </div>
            <p className="text-sm text-primary-100 leading-relaxed mb-6">
              {classInfo.description}
            </p>
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-primary-200">
                <Users className="h-4 w-4" />
                {classInfo.memberCount} students
              </div>
              <div className="flex items-center gap-1.5 text-primary-200">
                <Clock className="h-4 w-4" />
                {classInfo.schedule}
              </div>
              <div className="flex items-center gap-1.5 text-primary-200">
                <BarChart3 className="h-4 w-4" />
                {classInfo.progress}% complete
              </div>
            </div>
          </div>

          {/* Announcements */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              Recent Announcements
            </h3>
            <div className="space-y-3">
              {classInfo.announcements.map((ann) => (
                <div
                  key={ann.id}
                  className="bg-white rounded-xl border border-neutral-200 p-4 hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-neutral-900">
                        {ann.title}
                      </h4>
                      <p className="text-sm text-neutral-600 mt-1">
                        {ann.content}
                      </p>
                    </div>
                    <span className="text-xs text-neutral-400 whitespace-nowrap">
                      {ann.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Right column (1/3) ─────────────────────────── */}
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-neutral-900">
                Course Progress
              </h3>
              <span className="text-sm font-semibold text-primary-700">
                {classInfo.progress}%
              </span>
            </div>
            <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary-700 rounded-full transition-all duration-500"
                style={{ width: `${classInfo.progress}%` }}
              />
            </div>
          </div>

          {/* Quick links */}
          <div className="bg-white rounded-xl border border-neutral-200 p-5">
            <h3 className="text-sm font-semibold text-neutral-900 mb-3">
              Quick Access
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  icon: BookOpen,
                  label: "Study",
                  color: "bg-primary-50 text-primary-700",
                  route: "study",
                },
                {
                  icon: BarChart3,
                  label: "Quizzes",
                  color: "bg-accent-50 text-accent-600",
                  route: "quiz",
                },
                {
                  icon: Users,
                  label: "Chat",
                  color: "bg-success-50 text-success-600",
                  route: "chat",
                },
                {
                  icon: GraduationCap,
                  label: "Library",
                  color: "bg-secondary-50 text-secondary-600",
                  route: "library",
                },
              ].map(({ icon: Icon, label, color, route }) => (
                <button
                  key={label}
                  onClick={() => goTo(route)}
                  className="flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-neutral-200 hover:shadow-sm hover:border-primary-200 transition-all cursor-pointer"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
