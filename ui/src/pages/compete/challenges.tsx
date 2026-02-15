import { challengesApi } from "@/lib/api";
import type { Challenge } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CheckCircle,
  Clock,
  Plus,
  Swords,
  Trophy,
  XCircle,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttons";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const statusVariant: Record<
  string,
  "default" | "primary" | "success" | "warning" | "danger"
> = {
  pending: "warning",
  in_progress: "primary",
  completed: "success",
  expired: "default",
  declined: "danger",
  cancelled: "default",
};

export default function ChallengesPage() {
  const queryClient = useQueryClient();

  const { data: challenges = [], isLoading } = useQuery<Challenge[]>({
    queryKey: ["challenges"],
    queryFn: () => challengesApi.list() as Promise<Challenge[]>,
  });

  const acceptMutation = useMutation({
    mutationFn: (id: string) => challengesApi.accept(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["challenges"] }),
  });

  const declineMutation = useMutation({
    mutationFn: (id: string) => challengesApi.decline(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["challenges"] }),
  });

  const activeChallenges = challenges.filter(
    (c) => c.status === "pending" || c.status === "in_progress",
  );

  const historyChallenges = challenges.filter(
    (c) =>
      c.status === "completed" ||
      c.status === "expired" ||
      c.status === "declined" ||
      c.status === "cancelled",
  );

  const ChallengeCard = ({ c }: { c: Challenge }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant={statusVariant[c.status] ?? "default"}>
                {c.status.replace("_", " ")}
              </Badge>
              <span className="text-xs text-neutral-400">
                {c.question_count} questions
              </span>
            </div>
            <div className="text-sm text-neutral-600">
              Wager:{" "}
              <span className="font-bold text-accent-600">
                {c.wager_amount} pts
              </span>
            </div>
            <div className="text-xs text-neutral-500">
              Opponent:{" "}
              <span className="font-medium text-neutral-700">
                {c.opponent_id.slice(0, 8)}...
              </span>
            </div>
          </div>

          {["completed", "in_progress"].includes(c.status) && (
            <div className="text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
                Scores
              </p>
              <p className="mt-0.5 text-sm font-semibold text-neutral-700">
                {c.challenger_score !== null
                  ? `${Math.round((c.challenger_score ?? 0) * 100)}%`
                  : "—"}
                {" vs "}
                {c.opponent_score !== null
                  ? `${Math.round((c.opponent_score ?? 0) * 100)}%`
                  : "—"}
              </p>
              {c.winner_id && (
                <p className="mt-1 text-xs font-medium text-success-600 flex items-center justify-end gap-1">
                  <Trophy className="h-3 w-3" />
                  Winner
                </p>
              )}
            </div>
          )}
        </div>

        {/* Actions for pending challenges */}
        {c.status === "pending" && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-neutral-100">
            <Button
              size="sm"
              onClick={() => acceptMutation.mutate(c.id)}
              loading={acceptMutation.isPending}
              className="flex-1"
            >
              <CheckCircle className="mr-1 h-4 w-4" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => declineMutation.mutate(c.id)}
              loading={declineMutation.isPending}
              className="flex-1"
            >
              <XCircle className="mr-1 h-4 w-4" />
              Decline
            </Button>
          </div>
        )}

        <div className="mt-3 flex items-center gap-1 text-xs text-neutral-400">
          <Clock className="h-3 w-3" />
          {new Date(c.created_at).toLocaleDateString()} &middot; Expires{" "}
          {new Date(c.expires_at).toLocaleDateString()}
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) return <SectionLoader />;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">
            1v1 Challenges
          </h1>
          <p className="text-sm text-neutral-500">
            Test your knowledge against others.
          </p>
        </div>
        <Button size="sm">
          <Plus className="mr-2 h-4 w-4" />
          New Challenge
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="active">Active & Pending</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {activeChallenges.length > 0 ? (
            activeChallenges.map((c) => <ChallengeCard key={c.id} c={c} />)
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-dashed border-neutral-300">
              <Swords className="h-10 w-10 text-neutral-300 mx-auto mb-3" />
              <p className="text-neutral-500 font-medium">
                No active challenges.
              </p>
              <p className="text-sm text-neutral-400">
                Start a new one to test your skills!
              </p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {historyChallenges.length > 0 ? (
            historyChallenges.map((c) => <ChallengeCard key={c.id} c={c} />)
          ) : (
            <div className="text-center py-12">
              <p className="text-neutral-500">No challenge history yet.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
