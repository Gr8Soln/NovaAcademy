import {
  Bar,
  BarChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { analyticsApi, challengesApi, dashboardApi } from "@/lib/api";
import type { Challenge, DashboardData, UserAnalytics } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart3,
  BookOpen,
  BrainCircuit,
  Clock,
  Flame,
  Play,
  Shield,
  Swords,
  Target,
  Trophy,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";
import { pages } from "@/lib/constant";
import { useAuthStore } from "@/stores";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: () => dashboardApi.get() as Promise<DashboardData>,
  });

  const { data: challenges } = useQuery<Challenge[]>({
    queryKey: ["challenges", "pending"],
    queryFn: () => challengesApi.list() as Promise<Challenge[]>,
  });

  const { data: analytics } = useQuery<UserAnalytics>({
    queryKey: ["analytics", "me"],
    queryFn: () => analyticsApi.me() as Promise<UserAnalytics>,
  });

  if (isLoading) return <SectionLoader />;

  // Mock data for graphs/streaks if not in API yet
  const studyData = [
    { day: "Mon", minutes: 35 },
    { day: "Tue", minutes: 85 },
    { day: "Wed", minutes: 60 },
    { day: "Thu", minutes: 55 },
    { day: "Fri", minutes: 90 },
    { day: "Sat", minutes: 120 },
    { day: "Sun", minutes: 25 },
  ];

  const mockSubjectData = [
    { subject: "Math", A: 120, fullMark: 150 },
    { subject: "Science", A: 98, fullMark: 150 },
    { subject: "English", A: 86, fullMark: 150 },
    { subject: "History", A: 99, fullMark: 150 },
    { subject: "Geography", A: 85, fullMark: 150 },
    { subject: "Physics", A: 65, fullMark: 150 },
  ];

  const stats = [
    {
      label: "Total Points",
      value: (analytics?.total_points || 0).toLocaleString(),
      icon: Trophy,
      color: "text-yellow-600",
      bg: "bg-yellow-100",
    },
    {
      label: "Study Time",
      value: `${Math.round((data?.total_study_time_seconds || 0) / 3600)}h`,
      icon: Clock,
      color: "text-blue-600",
      bg: "bg-blue-100",
    },
    {
      label: "Accuracy",
      value: `${Math.round((data?.overall_accuracy || 0) * 100)}%`,
      icon: Target,
      color: "text-emerald-600",
      bg: "bg-emerald-100",
    },
    {
      label: "Challenges",
      value: challenges?.length || 0,
      icon: Swords,
      color: "text-orange-600",
      bg: "bg-orange-100",
    },
  ];

  const pendingChallenges =
    challenges?.filter((c) => c.status === "pending").slice(0, 3) ?? [];
  const mostRecentDoc = data?.recent_documents?.[0];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      {/* Header & Streak */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col justify-center">
          <h1 className="font-display text-3xl font-bold text-primary-900">
            Welcome back, {user?.first_name}! 👋
          </h1>
          <p className="text-neutral-500 mt-2">
            You're on a roll. Keep up the momentum!
          </p>
        </div>
        <Card
          featured
          className="relative overflow-hidden border-none text-white shadow-lg shadow-primary-500/20"
        >
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <Flame className="h-5 w-5 text-accent-300 fill-accent-300" />
                <span className="text-sm font-bold uppercase tracking-wider text-primary-200">
                  Study Streak
                </span>
              </div>
              <div className="text-4xl font-display font-bold">5 Days</div>
            </div>
            <div className="text-right space-y-2">
              <div className="text-sm text-primary-200 mb-1">Target</div>
              <div className="font-mono font-semibold">30m / day</div>
            </div>
          </div>
          {/* Decorative glow */}
          <div className="absolute -right-6 -bottom-6 h-24 w-24 rounded-full bg-accent-500/20 blur-2xl" />
        </Card>
      </div>

      {/* Stats Ribbon */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center ${stat.bg} ${stat.color}`}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[10px] text-neutral-500 font-medium uppercase tracking-wide">
                  {stat.label}
                </p>
                <p className="text-lg font-bold text-neutral-900">
                  {stat.value}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="font-display text-lg font-semibold text-primary-900 flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary-600" />
            Continue Learning
          </h2>

          {mostRecentDoc ? (
            <Card
              className="group cursor-pointer hover:border-primary-200 transition-all"
              onClick={() => navigate(`/study/${mostRecentDoc.id}`)}
            >
              <CardContent className="p-6 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
                <div className="h-16 w-16 rounded-xl bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-100 transition-colors flex-shrink-0">
                  <BookOpen className="h-8 w-8" />
                </div>
                <div className="flex-1">
                  <h3 className="font-display text-xl font-bold text-primary-900 group-hover:text-primary-700 transition-colors">
                    {mostRecentDoc.title}
                  </h3>
                  <p className="text-neutral-500 text-sm mt-1 mb-3">
                    Last accessed{" "}
                    {new Date(mostRecentDoc.created_at).toLocaleDateString()}
                  </p>
                  <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 w-3/4 rounded-full" />
                  </div>
                  <div className="flex justify-between text-xs text-neutral-400 mt-2">
                    <span>75% Completed</span>
                    <span>15 min left</span>
                  </div>
                </div>
                <Button
                  size="lg"
                  className="rounded-full h-12 w-12 p-0 flex-shrink-0 shadow-lg shadow-primary-500/20 group-hover:scale-105 transition-transform"
                >
                  <Play className="h-5 w-5 ml-0.5 fill-current" />
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-10">
                <p className="text-neutral-500 mb-4">
                  No recent documents found.
                </p>
                <Button onClick={() => navigate("/documents")}>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload First Document
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Visualization Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Study Activity */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-primary-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary-600" />
                  Study Activity
                </h2>
              </div>
              <Card className="h-[300px]">
                <CardContent className="p-4 h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studyData}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#9CA3AF", fontSize: 10 }}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: "#F3F4F6" }}
                        contentStyle={{
                          borderRadius: "8px",
                          border: "none",
                          boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                        }}
                      />
                      <Bar
                        dataKey="minutes"
                        fill="#3B5BDB"
                        radius={[4, 4, 0, 0]}
                        barSize={30}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Subject Mastery Radar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold text-primary-900 flex items-center gap-2">
                  <BrainCircuit className="h-5 w-5 text-accent-600" />
                  Subject Mastery
                </h2>
              </div>
              <Card className="h-[300px]">
                <CardContent className="p-4 h-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={mockSubjectData}>
                      <PolarGrid stroke="#e5e5e5" />
                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fill: "#737373", fontSize: 10 }}
                      />
                      <Radar
                        name="Mastery"
                        dataKey="A"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.5}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Right Col: Quick Actions & Challenges */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader className="pb-3 border-b border-neutral-100 mb-2">
              <h3 className="font-display text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-primary-500" />
                Quick Actions
              </h3>
            </CardHeader>
            <CardContent className="p-2 pt-0">
              <div className="space-y-1">
                <button
                  onClick={() => navigate(pages.documents)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-all text-left group"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600 group-hover:bg-primary-100">
                    <Upload className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-primary-700">
                    Upload New Document
                  </span>
                </button>
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-all text-left group"
                  onClick={() => navigate(pages.examHall)}
                >
                  <div className="h-8 w-8 rounded-lg bg-accent-50 flex items-center justify-center text-accent-600 group-hover:bg-accent-100">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-accent-700">
                    Enter Exam Hall
                  </span>
                </button>
                <button
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-neutral-50 transition-all text-left group"
                  onClick={() => navigate(pages.challenges)}
                >
                  <div className="h-8 w-8 rounded-lg bg-success-50 flex items-center justify-center text-success-600 group-hover:bg-success-100">
                    <Swords className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700 group-hover:text-success-700">
                    1v1 Challenge
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Challenges */}
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-display text-lg font-semibold text-primary-900">
                Challenges
              </h2>
              <Link
                to={pages.challenges}
                className="text-xs font-semibold text-primary-600 hover:text-primary-700"
              >
                View All
              </Link>
            </div>
            {pendingChallenges.length > 0 ? (
              <div className="space-y-3">
                {pendingChallenges.map((c) => (
                  <Card
                    key={c.id}
                    className="p-4 flex items-center justify-between hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-neutral-100 flex items-center justify-center">
                        <Swords className="h-5 w-5 text-neutral-500" />
                      </div>
                      <div>
                        <div className="text-sm font-bold text-neutral-900">
                          {c.wager_amount} pts
                        </div>
                        <div className="text-xs text-neutral-500">
                          vs Opponent
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(pages.challenges)}
                    >
                      View
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-neutral-50 border-dashed">
                <CardContent className="p-6 text-center">
                  <Trophy className="h-8 w-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">
                    No active challenges.
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate(pages.challenges)}
                    className="mt-2"
                  >
                    Create one?
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
