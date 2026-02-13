import { postsApi } from "@/lib/api";
import type { Post } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Eye, Heart, MessageSquarePlus, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/buttons";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";

export default function FeedPage() {
  const [content, setContent] = useState("");
  const [tab, setTab] = useState<"feed" | "explore">("feed");
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);

  const { data: posts = [], isLoading } = useQuery<Post[]>({
    queryKey: ["posts", tab],
    queryFn: () =>
      (tab === "feed" ? postsApi.feed() : postsApi.explore()) as Promise<
        Post[]
      >,
  });

  const createPost = useMutation({
    mutationFn: () => postsApi.create(content),
    onSuccess: () => {
      setContent("");
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      toast.success("Post shared!");
    },
  });

  const likePost = useMutation({
    mutationFn: (postId: string) => postsApi.like(postId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts"] }),
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 lg:pb-0">
      <h1 className="font-display text-2xl font-bold text-primary-900">
        Social Feed
      </h1>

      {/* Compose */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar name={user?.full_name ?? "User"} size="sm" />
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share a study win, insight, or question..."
                className="w-full min-h-[80px] resize-none bg-transparent text-sm text-neutral-700 placeholder:text-neutral-400 focus:outline-none"
                maxLength={280}
              />
              <div className="flex items-center justify-between border-t border-neutral-100 pt-3 mt-1">
                <span
                  className={cn(
                    "text-xs",
                    content.length > 250
                      ? "text-danger-500"
                      : "text-neutral-400",
                  )}
                >
                  {content.length}/280
                </span>
                <Button
                  size="sm"
                  onClick={() => createPost.mutate()}
                  disabled={!content.trim()}
                  loading={createPost.isPending}
                >
                  <MessageSquarePlus className="mr-1.5 h-4 w-4" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-neutral-100 p-1">
        {(["feed", "explore"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "flex-1 rounded-md py-2 text-sm font-medium transition-colors",
              tab === t
                ? "bg-white text-primary-700 shadow-sm"
                : "text-neutral-500 hover:text-neutral-700",
            )}
          >
            {t === "feed" ? "Following" : "Explore"}
          </button>
        ))}
      </div>

      {/* Posts */}
      {isLoading ? (
        <SectionLoader />
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-12 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-50">
              <Sparkles className="h-6 w-6 text-primary-400" />
            </div>
            <p className="text-sm text-neutral-500">
              {tab === "feed"
                ? "No posts yet. Follow some students to see their posts!"
                : "No posts yet. Be the first to share!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar name={post.user_id.slice(0, 8)} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">
                        {post.user_id.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-neutral-400">
                        {new Date(post.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm text-neutral-700 whitespace-pre-wrap">
                      {post.content}
                    </p>
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        onClick={() => likePost.mutate(post.id)}
                        className="flex items-center gap-1 text-xs text-neutral-400 hover:text-danger-500 transition-colors"
                      >
                        <Heart className="h-4 w-4" />
                        <span>{post.like_count}</span>
                      </button>
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <Eye className="h-4 w-4" />
                        {post.impression_count}
                      </span>
                    </div>
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
