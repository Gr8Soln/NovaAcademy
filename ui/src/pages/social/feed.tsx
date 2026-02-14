import { postsApi, leaderboardApi } from "@/lib/api";
import type { Post, LeaderboardEntry } from "@/types";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Heart,
  MessageSquare,
  MoreHorizontal,
  Send,
  Share2,
  TrendingUp,
  UserPlus,
} from "lucide-react";
import { useState } from "react";
import { formatDistanceToNow } from "date-fns";

import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/buttons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";
import { useAuthStore } from "@/stores";

export default function FeedPage() {
  const { user } = useAuthStore();
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  // Queries
  const { data: posts, isLoading } = useQuery<Post[]>({
    queryKey: ["posts", "feed"],
    queryFn: () => postsApi.feed() as Promise<Post[]>,
  });

  const { data: topUsers } = useQuery<LeaderboardEntry[]>({
    queryKey: ["leaderboard", "top"],
    queryFn: () => leaderboardApi.publicTop(3) as Promise<LeaderboardEntry[]>,
  });

  // Mutations
  const createPostMutation = useMutation({
    mutationFn: postsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts", "feed"] });
      setContent("");
    },
  });

  const likeMutation = useMutation({
    mutationFn: postsApi.like,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["posts", "feed"] }),
  });

  const handleLike = (post: Post) => {
    // Optimistic toggle not fully possible without is_liked status from backend
    // Just calling like for now
    likeMutation.mutate(post.id);
  };

  const handlePost = () => {
    if (!content.trim()) return;
    createPostMutation.mutate(content);
  };

  if (isLoading) return <SectionLoader />;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-6xl mx-auto pb-20 lg:pb-0">

      {/* LEFT COL: Feed (8 cols -> ~66%) */}
      <div className="lg:col-span-8 space-y-6">
        {/* Create Post */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex gap-4">
              <Avatar name={user?.full_name ?? "User"} />
              <div className="flex-1 space-y-3">
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Share a study win, insight, or question..."
                  className="w-full resize-none rounded-lg bg-neutral-50 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 min-h-[80px]"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handlePost}
                    disabled={createPostMutation.isPending || !content.trim()}
                    size="sm"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    Post
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feed Items */}
        <div className="space-y-4">
          {posts?.map((post) => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-4 sm:p-6">
                {/* Post Header */}
                <div className="flex items-start justify-between">
                  <div className="flex gap-3">
                    <Avatar name={post.user_id} />
                    <div>
                      <h3 className="font-semibold text-neutral-900 text-sm">
                        User {post.user_id.slice(0, 6)}...
                      </h3>
                      <p className="text-xs text-neutral-500">
                        {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <button className="text-neutral-400 hover:text-neutral-600">
                    <MoreHorizontal className="h-5 w-5" />
                  </button>
                </div>

                {/* Content */}
                <p className="mt-3 text-sm text-neutral-800 leading-relaxed whitespace-pre-wrap">
                  {post.content}
                </p>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-6 border-t border-neutral-100 pt-3">
                  <button
                    onClick={() => handleLike(post)}
                    className="flex items-center gap-2 text-sm text-neutral-500 hover:text-danger-600 transition-colors"
                  >
                    <Heart className="h-4 w-4" />
                    <span>{post.like_count}</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors">
                    <MessageSquare className="h-4 w-4" />
                    <span>Comments</span>
                  </button>
                  <button className="flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-700 transition-colors ml-auto">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>
              </CardContent>
            </Card>
          ))}

          {(!posts || posts.length === 0) && (
            <div className="text-center py-10">
              <p className="text-neutral-500">No posts yet. Be the first to share something!</p>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COL: Sidebar (4 cols -> ~33%) */}
      <div className="hidden lg:block lg:col-span-4 space-y-6">
        {/* Trending / Welcome */}
        <Card className="bg-gradient-to-br from-primary-900 to-primary-800 text-white border-none">
          <CardContent className="p-6">
            <h3 className="font-display font-bold text-lg mb-2">Community Guidelines</h3>
            <p className="text-primary-100 text-xs mb-4 leading-relaxed">
              Keep it academic and supportive. Share study tips, ask questions, and celebrate wins!
            </p>
          </CardContent>
        </Card>

        {/* Top Scholars / Who to Follow */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-accent-600" />
              <CardTitle className="text-sm">Top Scholars</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {topUsers?.slice(0, 5).map((user, idx) => (
              <div key={user.user_id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Avatar name={user.user_id} size="sm" />
                    <div className="absolute -top-1 -right-1 bg-accent-500 text-white text-[10px] font-bold h-4 w-4 rounded-full flex items-center justify-center border border-white">
                      {idx + 1}
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-neutral-900 truncate max-w-[120px]">
                      User {user.user_id.slice(0, 6)}...
                    </p>
                    <p className="text-xs text-neutral-500">{user.score} pts</p>
                  </div>
                </div>
                <button className="text-primary-600 hover:bg-primary-50 p-1.5 rounded-full transition-colors">
                  <UserPlus className="h-4 w-4" />
                </button>
              </div>
            ))}
            {(!topUsers || topUsers.length === 0) && (
              <p className="text-xs text-neutral-400 italic">No leaderboard data yet.</p>
            )}
          </CardContent>
        </Card>

        <div className="text-xs text-neutral-400 text-center">
          © 2024 Gr8Academy • Academic Network
        </div>
      </div>
    </div>
  );
}
