import { challengesApi, dashboardApi } from "@/lib/api";
import type { Challenge, DashboardData } from "@/types";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Clock,
  Flame,
  Play,
  Shield,
  Swords,
  Trophy,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Button } from "@/components/ui/buttons";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";
import { useAuthStore } from "@/stores";
import { pages } from "@/lib/constant";

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

  const pendingChallenges =
    challenges?.filter((c) => c.status === "pending").slice(0, 3) ?? [];
  const mostRecentDoc = data?.recent_documents?.[0];

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 flex flex-col justify-center">
          <h1 className="font-display text-3xl font-bold text-primary-900">
            Welcome back, {user?.full_name?.split(" ")[1]}! 👋
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

          {/* Study Time Graph */}
          <div className="pt-2">
            {" "}
            {/* Visual separation */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-lg font-semibold text-primary-900 flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                Study Activity
              </h2>
              <select className="bg-transparent text-sm font-medium text-neutral-500 focus:outline-none cursor-pointer">
                <option>This Week</option>
                <option>Last Week</option>
              </select>
            </div>
            <Card>
              <CardContent className="p-6 h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={studyData}>
                    <XAxis
                      dataKey="day"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#9CA3AF", fontSize: 12 }}
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
                      barSize={45}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Col: Quick Actions & Challenges */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <h3 className="font-display text-sm font-semibold text-neutral-900 uppercase tracking-wider">
                Quick Actions
              </h3>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-neutral-100">
                <button
                  onClick={() => navigate(pages.documents)}
                  className="w-full flex items-center gap-3 py-4 hover:px-4 rounded-lg hover:bg-neutral-50 transition-all text-left"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary-50 flex items-center justify-center text-primary-600">
                    <Upload className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700">
                    Upload New Document
                  </span>
                </button>
                <button
                  className="w-full flex items-center gap-3 py-4 hover:px-4 rounded-lg hover:bg-neutral-50 transition-all text-left"
                  onClick={() => navigate(pages.examHall)}
                >
                  <div className="h-8 w-8 rounded-lg bg-accent-50 flex items-center justify-center text-accent-600">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700">
                    Enter Exam Hall
                  </span>
                </button>
                <button
                  className="w-full flex items-center gap-3 py-4 hover:px-4 rounded-lg hover:bg-neutral-50 transition-all text-left"
                  onClick={() => navigate(pages.challenges)}
                >
                  <div className="h-8 w-8 rounded-lg bg-success-50 flex items-center justify-center text-success-600">
                    <Swords className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-medium text-neutral-700">
                    1v1 Challenge
                  </span>
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Upcoming Challenges */}
          <div>
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
                    className="p-4 flex items-center justify-between"
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
