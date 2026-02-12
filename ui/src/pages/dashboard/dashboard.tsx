import { dashboardApi } from "@/lib/api";
import type { DashboardData } from "@/types";
import { useQuery } from "@tanstack/react-query";

export default function DashboardPage() {
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get() as Promise<DashboardData>,
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500">
        Loading dashboard...
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Documents", value: data?.total_documents ?? 0, icon: "📄" },
          {
            label: "Quizzes Taken",
            value: data?.total_quizzes_taken ?? 0,
            icon: "📝",
          },
          {
            label: "Accuracy",
            value: `${((data?.overall_accuracy ?? 0) * 100).toFixed(1)}%`,
            icon: "🎯",
          },
          {
            label: "Study Time",
            value: `${Math.round((data?.total_study_time_seconds ?? 0) / 60)} min`,
            icon: "⏱️",
          },
        ].map((s) => (
          <div
            key={s.label}
            className="bg-white rounded-xl p-5 shadow-sm border"
          >
            <div className="text-2xl mb-2">{s.icon}</div>
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="text-2xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent documents */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Recent Documents
        </h2>
        {data?.recent_documents.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No documents yet. Upload your first study material!
          </p>
        ) : (
          <div className="space-y-3">
            {data?.recent_documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between py-2 border-b last:border-0"
              >
                <div>
                  <p className="font-medium text-gray-900">{doc.title}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(doc.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    doc.status === "completed"
                      ? "bg-green-100 text-green-700"
                      : doc.status === "processing"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {doc.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
