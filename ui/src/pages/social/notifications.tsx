import { notificationsApi } from "@/lib/api";
import type { Notification } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/buttons";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const queryClient = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery<Notification[]>({
    queryKey: ["notifications"],
    queryFn: () => notificationsApi.list() as Promise<Notification[]>,
  });

  const markRead = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">
            Notifications
          </h1>
          <p className="text-sm text-neutral-500">
            Stay updated with your activity.
          </p>
        </div>
        {notifications.some((n) => !n.is_read) && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => markAllRead.mutate()}
            loading={markAllRead.isPending}
          >
            <CheckCheck className="mr-1.5 h-4 w-4" />
            Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <SectionLoader />
      ) : notifications.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100">
              <Bell className="h-6 w-6 text-neutral-400" />
            </div>
            <p className="text-sm text-neutral-500">
              No notifications yet. Interact with the platform to start
              receiving updates!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                !n.is_read && "ring-1 ring-primary-200 bg-primary-50/30",
              )}
              onClick={() => !n.is_read && markRead.mutate(n.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full",
                      n.is_read ? "bg-neutral-100" : "bg-primary-100",
                    )}
                  >
                    <Bell
                      className={cn(
                        "h-4 w-4",
                        n.is_read ? "text-neutral-400" : "text-primary-600",
                      )}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p
                          className={cn(
                            "text-sm",
                            n.is_read
                              ? "text-neutral-600"
                              : "font-medium text-neutral-900",
                          )}
                        >
                          {n.title}
                        </p>
                        <p className="mt-0.5 text-xs text-neutral-500">
                          {n.message}
                        </p>
                      </div>
                      {!n.is_read && (
                        <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500" />
                      )}
                    </div>
                    <p className="mt-1.5 text-xs text-neutral-400">
                      {new Date(n.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
