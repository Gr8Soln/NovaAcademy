import { leaderboardApi } from "@/lib/api";
import type { LeaderboardEntry } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, Trophy } from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";

type BoardType = "points" | "study_time";
type Period = "weekly" | "monthly" | "all_time";

const rankIcon = (rank: number) => {
  if (rank === 1) return <Crown className="h-5 w-5 text-accent-500" />;
  if (rank === 2) return <Medal className="h-5 w-5 text-neutral-400" />;
  if (rank === 3) return <Medal className="h-5 w-5 text-amber-600" />;
  return null;
};

export default function LeaderboardPage() {
  const [boardType, setBoardType] = useState<BoardType>("points");
  const [period, setPeriod] = useState<Period>("weekly");

  const { data: entries = [], isLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", boardType, period],
    queryFn: () =>
      leaderboardApi.get(boardType, period) as Promise<LeaderboardEntry[]>,
  });

  const { data: myRank } = useQuery<LeaderboardEntry | null>({
    queryKey: ["leaderboard-rank", boardType, period],
    queryFn: () =>
      leaderboardApi.myRank(
        boardType,
        period,
      ) as Promise<LeaderboardEntry | null>,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-0">
      <h1 className="font-display text-2xl font-bold text-primary-900">
        Leaderboard
      </h1>

      {/* Board type toggle */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
        {[
          { value: "points" as const, label: "Points" },
          { value: "study_time" as const, label: "Study Time" },
        ].map((t) => (
          <button
            key={t.value}
            onClick={() => setBoardType(t.value)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
              boardType === t.value
                ? "bg-white text-primary-700 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Period selector */}
      <div className="flex gap-2">
        {[
          { value: "weekly" as const, label: "This Week" },
          { value: "monthly" as const, label: "This Month" },
          { value: "all_time" as const, label: "All Time" },
        ].map((p) => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              period === p.value
                ? "border-primary-300 bg-primary-50 text-primary-700"
                : "border-neutral-200 text-neutral-500 hover:border-neutral-300",
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* My rank badge */}
      {myRank && (
        <Card featured>
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-primary-300">
                  Your Rank
                </p>
                <div className="mt-1 flex items-baseline gap-3">
                  <span className="text-3xl font-bold text-white">
                    #{myRank.rank}
                  </span>
                  <span className="text-lg text-primary-200">
                    {boardType === "points"
                      ? `${myRank.score.toLocaleString()} pts`
                      : `${Math.round(myRank.score / 60)} min`}
                  </span>
                </div>
              </div>
              <Trophy className="h-10 w-10 text-accent-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard table */}
      {isLoading ? (
        <SectionLoader />
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <Trophy className="mb-3 h-10 w-10 text-neutral-300" />
            <p className="text-sm text-neutral-500">
              No entries yet. Start studying to appear on the leaderboard!
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-100">
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500 w-16">
                    Rank
                  </th>
                  <th className="p-3 text-left text-xs font-medium uppercase tracking-wider text-neutral-500">
                    Student
                  </th>
                  <th className="p-3 text-right text-xs font-medium uppercase tracking-wider text-neutral-500">
                    {boardType === "points" ? "Points" : "Study Time"}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-50">
                {entries.map((entry) => (
                  <tr
                    key={entry.user_id}
                    className="hover:bg-neutral-50 transition-colors"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        {rankIcon(entry.rank) || (
                          <span className="text-sm font-bold text-neutral-400">
                            #{entry.rank}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={entry.user_id.slice(0, 8)} size="sm" />
                        <span className="text-sm font-medium text-neutral-700">
                          {entry.user_id.slice(0, 8)}...
                        </span>
                      </div>
                    </td>
                    <td className="p-3 text-right text-sm font-semibold text-neutral-800">
                      {boardType === "points"
                        ? entry.score.toLocaleString()
                        : `${Math.round(entry.score / 60)} min`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
