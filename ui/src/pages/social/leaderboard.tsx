import { leaderboardApi } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Clock, Crown, Trophy } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";

const podiumColors = [
  "bg-yellow-100 text-yellow-700 border-yellow-200", // Gold
  "bg-neutral-200 text-neutral-700 border-neutral-300", // Silver
  "bg-orange-100 text-orange-800 border-orange-200", // Bronze
];

export default function LeaderboardPage() {
  const { user } = useAuthStore();
  const [boardType, setBoardType] = useState<"points" | "study-time">("points");
  const [period, setPeriod] = useState<"weekly" | "monthly" | "all-time">("weekly");

  const { data: leaderboard = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", boardType, period],
    queryFn: () => leaderboardApi.get(boardType, period, 50) as Promise<LeaderboardEntry[]>,
  });

  const { data: myRank } = useQuery<LeaderboardEntry>({
    queryKey: ["leaderboard", "me", boardType, period],
    queryFn: () => leaderboardApi.myRank(boardType, period) as Promise<LeaderboardEntry>,
  });

  const top3 = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  const formatScore = (score: number) => {
    if (boardType === "study-time") {
      const hours = Math.floor(score / 3600);
      const minutes = Math.floor((score % 3600) / 60);
      return `${hours}h ${minutes}m`;
    }
    return `${score} pts`;
  };

  const PodiumItem = ({ entry, rank }: { entry: LeaderboardEntry; rank: number }) => (
    <div className={cn("flex flex-col items-center", rank === 1 ? "order-2 -mt-6" : rank === 2 ? "order-1" : "order-3")}>
      <div className="relative mb-2">
        <Avatar name={entry.user_id} size={rank === 1 ? "lg" : "md"} className={cn("border-4", rank === 1 ? "border-yellow-100" : rank === 2 ? "border-neutral-200" : "border-orange-100")} />
        <div className={cn("absolute -bottom-2 md:-bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-full h-6 w-6 md:h-8 md:w-8 border-2 font-bold text-xs md:text-sm", podiumColors[rank - 1])}>
          {rank}
        </div>
        {rank === 1 && <Crown className="absolute -top-6 left-1/2 -translate-x-1/2 h-6 w-6 text-yellow-500 fill-current" />}
      </div>
      <div className="text-center mt-2">
        <p className="font-semibold text-neutral-900 text-sm truncate max-w-[100px]">{entry.user_id.slice(0, 8)}...</p>
        <p className="text-xs font-bold text-accent-600">{formatScore(entry.score)}</p>
      </div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto pb-24 lg:pb-0 relative min-h-screen">
      <div className="space-y-6">
        <div className="text-center space-y-2">
          <h1 className="font-display text-2xl font-bold text-primary-900">Leaderboard</h1>
          <p className="text-sm text-neutral-500">See who's leading the pack!</p>
        </div>

        {/* Controls */}
        <div className="flex flex-col items-center gap-4">
          <Tabs value={boardType} onValueChange={(v) => setBoardType(v as any)} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="points">
                <Trophy className="mr-2 h-4 w-4" />
                Points
              </TabsTrigger>
              <TabsTrigger value="study-time">
                <Clock className="mr-2 h-4 w-4" />
                Study Time
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex gap-2 bg-neutral-100 p-1 rounded-lg">
            {(["weekly", "monthly", "all-time"] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={cn("px-3 py-1 text-xs font-medium rounded-md transition-all", period === p ? "bg-white text-neutral-900 shadow-sm" : "text-neutral-500 hover:text-neutral-900")}
              >
                {p.replace("-", " ")}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <SectionLoader />
        ) : (
          <div className="space-y-8">
            {/* Podium */}
            {top3.length > 0 && (
              <div className="flex justify-center items-end gap-4 md:gap-8 py-8">
                {top3[1] && <PodiumItem entry={top3[1]} rank={2} />}
                {top3[0] && <PodiumItem entry={top3[0]} rank={1} />}
                {top3[2] && <PodiumItem entry={top3[2]} rank={3} />}
              </div>
            )}

            {/* List */}
            <Card>
              <CardContent className="p-0 divide-y divide-neutral-100">
                {rest.map((entry, idx) => (
                  <div key={entry.user_id} className="flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-neutral-400 w-6 text-center">{idx + 4}</span>
                      <Avatar name={entry.user_id} size="sm" />
                      <span className="text-sm font-medium text-neutral-900">{entry.user_id.slice(0, 8)}...</span>
                    </div>
                    <span className="text-sm font-bold text-neutral-700">{formatScore(entry.score)}</span>
                  </div>
                ))}
                {rest.length === 0 && top3.length === 0 && (
                  <div className="p-8 text-center text-neutral-500">No data found for this period.</div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Sticky User Rank Footer */}
      {user && myRank && (
        <div className="fixed bottom-0 left-0 right-0 lg:left-64 bg-white border-t border-neutral-200 p-4 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-40">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center justify-center bg-primary-100 text-primary-700 h-10 w-10 rounded-lg font-bold text-sm">
                {myRank.rank}
              </div>
              <div className="flex items-center gap-3">
                <Avatar name={user.full_name} size="sm" />
                <div>
                  <p className="text-sm font-semibold text-neutral-900">You</p>
                  <p className="text-xs text-neutral-500">{myRank.rank > 3 ? "Keep pushing!" : "You're at the top!"}</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-primary-600">{formatScore(myRank.score)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
