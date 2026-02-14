import { analyticsApi } from "@/lib/api";
import type { UserAnalytics } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Clock,
  Swords,
  Target,
  Trophy,
  Users,
} from "lucide-react";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";

const mockSubjectData = [
  { subject: "Math", A: 120, fullMark: 150 },
  { subject: "Science", A: 98, fullMark: 150 },
  { subject: "English", A: 86, fullMark: 150 },
  { subject: "History", A: 99, fullMark: 150 },
  { subject: "Geography", A: 85, fullMark: 150 },
  { subject: "Physics", A: 65, fullMark: 150 },
];

export default function AnalyticsPage() {
  const { data: analytics, isLoading } = useQuery<UserAnalytics>({
    queryKey: ["analytics", "me"],
    queryFn: () => analyticsApi.me() as Promise<UserAnalytics>,
  });

  if (isLoading) return <SectionLoader />;
  if (!analytics) return <div>No data available</div>;

  const stats = [
    {
      label: "Total Points",
      value: analytics.total_points.toLocaleString(),
      icon: Trophy,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      label: "Study Time",
      value: `${Math.round(analytics.total_study_seconds / 3600)}h`,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Quizzes Taken",
      value: analytics.total_quizzes,
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Challenges",
      value: analytics.total_challenges,
      icon: Swords,
      color: "text-orange-600",
      bg: "bg-orange-100",
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20 lg:pb-0">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center text-primary-600">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">
            Performance Analytics
          </h1>
          <p className="text-sm text-neutral-500">
            Track your growth and mastery across subjects.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Radar Chart Section */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-accent-500" />
              Subject Mastery
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockSubjectData}>
                  <PolarGrid stroke="#e5e5e5" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#737373', fontSize: 12 }} />
                  <Radar
                    name="Mastery"
                    dataKey="A"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.5}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Stats Column */}
        <div className="space-y-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="overflow-hidden">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs text-neutral-500 font-medium uppercase tracking-wide">{stat.label}</p>
                  <p className="text-xl font-bold text-neutral-900">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Social Stats */}
          <Card>
            <CardContent className="p-4 flex justify-between items-center text-center divide-x divide-neutral-100">
              <div className="flex-1 px-2">
                <Users className="h-4 w-4 text-neutral-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-neutral-900">{analytics.followers_count}</p>
                <p className="text-[10px] text-neutral-500 uppercase">Followers</p>
              </div>
              <div className="flex-1 px-2">
                <BookOpen className="h-4 w-4 text-neutral-400 mx-auto mb-1" />
                <p className="text-lg font-bold text-neutral-900">{analytics.total_posts}</p>
                <p className="text-[10px] text-neutral-500 uppercase">Posts</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
