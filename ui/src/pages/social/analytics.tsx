import { analyticsApi, pointsApi, studySessionsApi } from "@/lib/api";
import type { StudyStats, UserAnalytics } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  Clock,
  MessageSquare,
  Star,
  Swords,
  Target,
  Users,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<UserAnalytics>({
    queryKey: ["analytics"],
    queryFn: () => analyticsApi.me() as Promise<UserAnalytics>,
  });

  const { data: balance } = useQuery<{ balance: number }>({
    queryKey: ["points-balance"],
    queryFn: () => pointsApi.balance() as Promise<{ balance: number }>,
  });

  const { data: studyStats } = useQuery<StudyStats>({
    queryKey: ["study-stats"],
    queryFn: () => studySessionsApi.stats() as Promise<StudyStats>,
  });

  if (isLoading) return <SectionLoader />;

  const stats = [
    {
      label: "Total Points",
      value: balance?.balance?.toLocaleString() ?? "0",
      icon: Star,
      color: "text-accent-600 bg-accent-50",
    },
    {
      label: "Followers",
      value: analytics?.followers_count ?? 0,
      icon: Users,
      color: "text-primary-600 bg-primary-50",
    },
    {
      label: "Following",
      value: analytics?.following_count ?? 0,
      icon: Users,
      color: "text-primary-600 bg-primary-50",
    },
    {
      label: "Posts",
      value: analytics?.total_posts ?? 0,
      icon: MessageSquare,
      color: "text-success-600 bg-success-50",
    },
    {
      label: "Study Time",
      value: `${studyStats?.total_hours ?? 0}h ${(studyStats?.total_minutes ?? 0) % 60}m`,
      icon: Clock,
      color: "text-warning-600 bg-warning-50",
    },
    {
      label: "Quizzes Taken",
      value: analytics?.total_quizzes ?? 0,
      icon: Target,
      color: "text-danger-600 bg-danger-50",
    },
    {
      label: "Challenges",
      value: analytics?.total_challenges ?? 0,
      icon: Swords,
      color: "text-accent-600 bg-accent-50",
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div>
        <h1 className="font-display text-2xl font-bold text-primary-900">
          Your Analytics
        </h1>
        <p className="text-sm text-neutral-500">
          Track your learning progress and engagement.
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color }) => (
          <Card key={label}>
            <CardContent className="flex flex-col items-center p-5 text-center">
              <div
                className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg ${color}`}
              >
                <Icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-primary-900">{value}</p>
              <p className="mt-1 text-xs font-medium text-neutral-500 uppercase tracking-wider">
                {label}
              </p>
            </CardContent>
          </Card>
        ))}

        {/* Placeholder card for future analytics */}
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center p-5 text-center">
            <BarChart3 className="mb-2 h-8 w-8 text-neutral-300" />
            <p className="text-xs text-neutral-400">
              More insights coming soon
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
