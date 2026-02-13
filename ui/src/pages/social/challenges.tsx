import { challengesApi } from "@/lib/api";
import type { Challenge } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, Clock, Swords, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttons";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";

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

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">
            Quiz Challenges
          </h1>
          <p className="text-sm text-neutral-500">
            Challenge friends to quiz duels and wager points!
          </p>
        </div>
        {/* TODO: add create challenge modal */}
      </div>

      {isLoading ? (
        <SectionLoader />
      ) : challenges.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-50">
              <Swords className="h-6 w-6 text-accent-500" />
            </div>
            <p className="text-sm text-neutral-500">
              No challenges yet. Challenge a study buddy to a quiz duel!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {challenges.map((c) => (
            <Card key={c.id} className="hover:shadow-md transition-shadow">
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
                  </div>

                  {c.status === "completed" && (
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
                          <CheckCircle className="h-3 w-3" />
                          Winner decided
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Actions for pending challenges */}
                {c.status === "pending" && (
                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      onClick={() => acceptMutation.mutate(c.id)}
                      loading={acceptMutation.isPending}
                    >
                      <CheckCircle className="mr-1 h-4 w-4" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => declineMutation.mutate(c.id)}
                      loading={declineMutation.isPending}
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
          ))}
        </div>
      )}
    </div>
  );
}
