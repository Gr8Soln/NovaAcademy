import { dashboardApi } from "@/lib/api";
import type { DashboardData } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Clock,
  FileText,
  Target,
  TrendingUp,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get() as Promise<DashboardData>,
  });

  if (isLoading) return <SectionLoader />;

  const stats = [
    {
      label: "Documents",
      value: data?.total_documents ?? 0,
      icon: FileText,
      color: "text-primary-600 bg-primary-50",
    },
    {
      label: "Quizzes Taken",
      value: data?.total_quizzes_taken ?? 0,
      icon: Target,
      color: "text-accent-600 bg-accent-50",
    },
    {
      label: "Accuracy",
      value: `${((data?.overall_accuracy ?? 0) * 100).toFixed(1)}%`,
      icon: TrendingUp,
      color: "text-success-600 bg-success-50",
    },
    {
      label: "Study Time",
      value: `${Math.round((data?.total_study_time_seconds ?? 0) / 60)} min`,
      icon: Clock,
      color: "text-warning-600 bg-warning-50",
    },
  ];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Page title */}
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">
            Dashboard
          </h1>
          <p className="text-sm text-neutral-500">
            Welcome back! Here's your learning overview.
          </p>
        </div>
        <Button size="sm" onClick={() => navigate("/documents")}>
          <Upload className="mr-1.5 h-4 w-4" />
          Upload Document
        </Button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="p-4 sm:p-5">
              <div
                className={`mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {label}
              </p>
              <p className="mt-1 text-2xl font-bold text-primary-900">
                {value}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-primary-900">
              Recent Documents
            </h2>
            <Link
              to="/documents"
              className="text-sm font-medium text-primary-500 hover:text-primary-700 transition-colors"
            >
              View all
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {data?.recent_documents.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
                <BookOpen className="h-6 w-6 text-neutral-400" />
              </div>
              <p className="text-sm text-neutral-500">
                No documents yet. Upload your first study material!
              </p>
            </div>
          ) : (
            <div className="divide-y divide-neutral-100">
              {data?.recent_documents.map((doc) => (
                <div
                  key={doc.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0 cursor-pointer hover:bg-neutral-50 -mx-1 px-1 rounded transition-colors"
                  onClick={() => navigate(`/study/${doc.id}`)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-50 text-primary-600 flex-shrink-0">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate">
                        {doc.title}
                      </p>
                      <p className="text-xs text-neutral-400">
                        {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={
                      doc.status === "completed"
                        ? "success"
                        : doc.status === "processing"
                          ? "warning"
                          : "default"
                    }
                  >
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
