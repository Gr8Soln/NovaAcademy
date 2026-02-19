import { Info, Phone, Search, Video } from "lucide-react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface ChatHeaderProps {
  groupName: string;
  groupAvatar?: string;
  memberCount: number;
  onlineCount: number;
  onToggleSidebar: () => void;
  sidebarOpen: boolean;
}

export default function ChatHeader({
  groupName,
  groupAvatar,
  memberCount,
  onlineCount,
  onToggleSidebar,
  sidebarOpen,
}: ChatHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 sm:px-5 h-[60px] bg-white border-b border-neutral-200/60 flex-shrink-0">
      {/* Group avatar & info */}
      <div
        className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer group"
        onClick={onToggleSidebar}
      >
        <div className="relative">
          <Avatar name={groupName} src={groupAvatar} size="md" />
          <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success-500 border-2 border-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
            {groupName}
          </h3>
          <p className="text-xs text-neutral-400">
            {memberCount} members ·{" "}
            <span className="text-success-500 font-medium">
              {onlineCount} online
            </span>
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5">
        <button
          className="flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all"
          title="Search messages"
        >
          <Search className="h-[18px] w-[18px]" />
        </button>
        <button
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all"
          title="Voice call"
        >
          <Phone className="h-[18px] w-[18px]" />
        </button>
        <button
          className="hidden sm:flex h-9 w-9 items-center justify-center rounded-xl text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-all"
          title="Video call"
        >
          <Video className="h-[18px] w-[18px]" />
        </button>
        <div className="w-px h-5 bg-neutral-200 mx-1 hidden sm:block" />
        <button
          onClick={onToggleSidebar}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
            sidebarOpen
              ? "text-primary-600 bg-primary-50 shadow-sm"
              : "text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100",
          )}
          title="Group info"
        >
          <Info className="h-[18px] w-[18px]" />
        </button>
      </div>
    </div>
  );
}
