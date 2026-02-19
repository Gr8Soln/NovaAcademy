import {
    Bot,
    Check,
    CheckCheck,
    CornerUpRight,
    Download,
    ExternalLink,
    FileText,
    MoreHorizontal,
    Pause,
    Play,
    Reply,
    Smile,
} from "lucide-react";
import { useState } from "react";

import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────── */
export interface MessageSender {
  id: string;
  name: string;
  avatar?: string;
  isOnline?: boolean;
  role?: "admin" | "moderator" | "member" | "ai";
}

export interface MessageAttachment {
  id: string;
  type: "image" | "file" | "voice" | "video";
  url: string;
  name?: string;
  size?: string;
  duration?: number;
  thumbnailUrl?: string;
  mimeType?: string;
}

export interface MessageReply {
  id: string;
  senderName: string;
  content: string;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface LinkPreview {
  url: string;
  title: string;
  description?: string;
  image?: string;
  siteName?: string;
}

export interface MessageData {
  id: string;
  content: string;
  sender: MessageSender;
  timestamp: string;
  attachments?: MessageAttachment[];
  replyTo?: MessageReply;
  mentions?: string[];
  reactions?: MessageReaction[];
  isEdited?: boolean;
  linkPreview?: LinkPreview;
  status?: "sent" | "delivered" | "read";
}

/* ── Helpers ───────────────────────────────── */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function renderContent(content: string): React.ReactNode {
  // Simple @mention and **bold** highlighting
  const parts = content.split(/(@\w+|@NovaAI|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return (
        <span key={i} className="font-semibold text-primary-600 bg-primary-50 px-0.5 rounded cursor-pointer hover:underline">
          {part}
        </span>
      );
    }
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

/* ── Component ─────────────────────────────── */
interface MessageProps {
  message: MessageData;
  isOwn?: boolean;
  showAvatar?: boolean;
  onReply?: (msg: MessageData) => void;
}

export default function ChatMessage({ message, isOwn = false, showAvatar = true, onReply }: MessageProps) {
  const [hovering, setHovering] = useState(false);
  const isAI = message.sender.role === "ai";

  return (
    <div
      className={cn("group relative px-4 sm:px-5 py-1 hover:bg-neutral-50/50 transition-colors", isAI && "bg-primary-50/30")}
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Reply reference */}
      {message.replyTo && (
        <div className="flex items-center gap-2 mb-1 ml-12 pl-3 border-l-2 border-primary-300">
          <Reply className="h-3 w-3 text-primary-500 flex-shrink-0" />
          <span className="text-[11px] font-semibold text-primary-600 truncate">{message.replyTo.senderName}</span>
          <span className="text-[11px] text-neutral-400 truncate flex-1">{message.replyTo.content}</span>
        </div>
      )}

      <div className="flex gap-3">
        {/* Avatar column */}
        <div className="flex-shrink-0 w-9">
          {showAvatar && (
            <div className="relative cursor-pointer group/avatar">
              {isAI ? (
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 shadow-sm">
                  <Bot className="h-4 w-4 text-white" />
                </div>
              ) : (
                <Avatar name={message.sender.name} src={message.sender.avatar} size="sm" className="h-9 w-9" />
              )}
              {message.sender.isOnline && !isAI && (
                <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-success-500 border-2 border-white" />
              )}
            </div>
          )}
        </div>

        {/* Content column */}
        <div className="flex-1 min-w-0">
          {/* Header line */}
          {showAvatar && (
            <div className="flex items-center gap-2 mb-0.5">
              <span
                className={cn(
                  "text-[13px] font-bold cursor-pointer hover:underline",
                  isAI ? "text-primary-700" : isOwn ? "text-accent-600" : "text-neutral-900",
                )}
              >
                {message.sender.name}
              </span>
              {message.sender.role === "admin" && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600">
                  Admin
                </span>
              )}
              {isAI && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700">
                  AI
                </span>
              )}
              <span className="text-[11px] text-neutral-400">{message.timestamp}</span>
              {message.isEdited && <span className="text-[10px] text-neutral-400 italic">(edited)</span>}
            </div>
          )}

          {/* Text content */}
          {message.content && (
            <p className="text-[13px] text-neutral-700 leading-relaxed whitespace-pre-wrap break-words">
              {renderContent(message.content)}
            </p>
          )}

          {/* Attachments */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="mt-2 space-y-2">
              {message.attachments.map((att) => (
                <AttachmentView key={att.id} attachment={att} />
              ))}
            </div>
          )}

          {/* Link preview */}
          {message.linkPreview && (
            <div className="mt-2 max-w-sm rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group/link">
              {message.linkPreview.image && (
                <div className="h-32 bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
                  <ExternalLink className="h-8 w-8 text-neutral-300" />
                </div>
              )}
              <div className="p-3">
                <p className="text-[10px] font-semibold text-primary-500 uppercase tracking-wider mb-0.5">
                  {message.linkPreview.siteName || new URL(message.linkPreview.url).hostname}
                </p>
                <p className="text-xs font-bold text-neutral-900 group-hover/link:text-primary-700 transition-colors line-clamp-2">
                  {message.linkPreview.title}
                </p>
                {message.linkPreview.description && (
                  <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">{message.linkPreview.description}</p>
                )}
              </div>
            </div>
          )}

          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {message.reactions.map((r, i) => (
                <button
                  key={i}
                  className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all",
                    r.reacted
                      ? "bg-primary-50 border-primary-200 text-primary-700"
                      : "bg-white border-neutral-200 text-neutral-600 hover:border-primary-200 hover:bg-primary-50",
                  )}
                >
                  <span>{r.emoji}</span>
                  <span className="font-medium text-[10px]">{r.count}</span>
                </button>
              ))}
              <button className="inline-flex items-center justify-center h-6 w-6 rounded-full border border-neutral-200 text-neutral-400 hover:border-primary-200 hover:text-primary-500 transition-all">
                <Smile className="h-3 w-3" />
              </button>
            </div>
          )}

          {/* Message status (own messages) */}
          {isOwn && message.status && (
            <div className="flex justify-end mt-0.5">
              {message.status === "read" ? (
                <CheckCheck className="h-3.5 w-3.5 text-primary-500" />
              ) : message.status === "delivered" ? (
                <CheckCheck className="h-3.5 w-3.5 text-neutral-400" />
              ) : (
                <Check className="h-3.5 w-3.5 text-neutral-400" />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Hover actions */}
      {hovering && (
        <div className="absolute -top-3 right-4 flex items-center gap-0.5 bg-white border border-neutral-200 rounded-lg shadow-lg px-1 py-0.5 z-10">
          <button
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            title="React"
          >
            <Smile className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            title="Reply"
            onClick={() => onReply?.(message)}
          >
            <CornerUpRight className="h-3.5 w-3.5" />
          </button>
          <button
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            title="Forward"
          >
            <CornerUpRight className="h-3.5 w-3.5 -scale-x-100" />
          </button>
          <button
            className="p-1.5 rounded-md text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors"
            title="More"
          >
            <MoreHorizontal className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Attachment Views ──────────────────────── */
function AttachmentView({ attachment }: { attachment: MessageAttachment }) {
  const [playing, setPlaying] = useState(false);

  switch (attachment.type) {
    case "image":
      return (
        <div className="max-w-xs rounded-xl overflow-hidden border border-neutral-200 cursor-pointer hover:shadow-md transition-shadow">
          <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
            {attachment.url ? (
              <img src={attachment.url} alt={attachment.name || "Image"} className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-1 text-neutral-400">
                <div className="h-10 w-10 rounded-lg bg-neutral-200 flex items-center justify-center">📷</div>
                <span className="text-[10px]">{attachment.name || "Image"}</span>
              </div>
            )}
          </div>
        </div>
      );

    case "video":
      return (
        <div className="max-w-sm rounded-xl overflow-hidden border border-neutral-200 cursor-pointer hover:shadow-md transition-shadow">
          <div className="relative aspect-video bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
            <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
              <Play className="h-5 w-5 text-white ml-0.5" />
            </div>
            {attachment.duration && (
              <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-mono">
                {formatDuration(attachment.duration)}
              </span>
            )}
          </div>
          {attachment.name && (
            <div className="p-2.5 bg-white">
              <p className="text-xs font-medium text-neutral-900 truncate">{attachment.name}</p>
              {attachment.size && <p className="text-[10px] text-neutral-400">{attachment.size}</p>}
            </div>
          )}
        </div>
      );

    case "voice":
      return (
        <div className="flex items-center gap-3 max-w-xs bg-neutral-100 rounded-2xl px-3 py-2">
          <button
            onClick={() => setPlaying(!playing)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-500 transition-colors flex-shrink-0"
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
          </button>
          <div className="flex-1 min-w-0">
            {/* Waveform visualization */}
            <div className="flex items-end gap-[2px] h-6">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-[3px] rounded-full transition-colors",
                    i < 12 ? "bg-primary-500" : "bg-neutral-300",
                  )}
                  style={{ height: `${Math.random() * 100}%`, minHeight: 3 }}
                />
              ))}
            </div>
            <span className="text-[10px] text-neutral-400 font-mono mt-0.5">
              {attachment.duration ? formatDuration(attachment.duration) : "0:00"}
            </span>
          </div>
        </div>
      );

    case "file":
      return (
        <div className="flex items-center gap-3 max-w-sm bg-neutral-50 border border-neutral-200 rounded-xl p-3 hover:shadow-sm transition-shadow cursor-pointer group/file">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100 text-primary-600 flex-shrink-0">
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-neutral-900 truncate">{attachment.name || "Document"}</p>
            <p className="text-[10px] text-neutral-400">{attachment.size || "Unknown size"}</p>
          </div>
          <button className="p-2 rounded-lg text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-colors opacity-0 group-hover/file:opacity-100">
            <Download className="h-4 w-4" />
          </button>
        </div>
      );

    default:
      return null;
  }
}
