import {
    Bot,
    Check,
    CheckCheck,
    CornerUpRight,
    Download,
    FileText,
    MoreHorizontal,
    Pause,
    Play,
    Smile,
    Sparkles,
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
  /** undefined for normal messages; "date_separator" for date dividers */
  type?: "date_separator";
  /** Used when type === "date_separator", e.g. "Today", "Yesterday", "Feb 15" */
  dateLabel?: string;
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

/* ── Color palettes ────────────────────────── */
/** Deterministic hash of a string → unsigned 32-bit integer */
function hashName(str: string): number {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = (((h << 5) + h) ^ str.charCodeAt(i)) >>> 0;
  }
  return h;
}

/** Light palette used for other-user message bubbles */
const SENDER_PALETTES = [
  { bubble: "bg-violet-50 border-violet-200/70", text: "text-neutral-800" },
  { bubble: "bg-emerald-50 border-emerald-200/70", text: "text-neutral-800" },
  { bubble: "bg-amber-50 border-amber-200/70", text: "text-neutral-800" },
  { bubble: "bg-rose-50 border-rose-200/70", text: "text-neutral-800" },
  { bubble: "bg-sky-50 border-sky-200/70", text: "text-neutral-800" },
  { bubble: "bg-indigo-50 border-indigo-200/70", text: "text-neutral-800" },
  { bubble: "bg-teal-50 border-teal-200/70", text: "text-neutral-800" },
  { bubble: "bg-fuchsia-50 border-fuchsia-200/70", text: "text-neutral-800" },
] as const;

function getSenderPalette(name: string) {
  return SENDER_PALETTES[hashName(name) % SENDER_PALETTES.length];
}

/* ── Helpers ───────────────────────────────── */
function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function renderContent(content: string, ownStyle = false): React.ReactNode {
  // Simple @mention and **bold** highlighting
  const parts = content.split(/(@\w+|@NovaAI|\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("@")) {
      return ownStyle ? (
        <span
          key={i}
          className="font-semibold text-primary-100 underline cursor-pointer"
        >
          {part}
        </span>
      ) : (
        <span
          key={i}
          className="font-semibold text-primary-600 bg-primary-50 px-0.5 rounded cursor-pointer hover:underline"
        >
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

export default function ChatMessage({
  message,
  isOwn = false,
  showAvatar = true,
  onReply,
}: MessageProps) {
  const [hovering, setHovering] = useState(false);
  const isAI = message.sender.role === "ai";

  /* ── Date separator ─────────────────────── */
  if (message.type === "date_separator") {
    return (
      <div className="flex items-center gap-3 px-5 py-3 my-1 select-none">
        <div className="flex-1 h-px bg-neutral-200" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400 px-1.5">
          {message.dateLabel ?? "Today"}
        </span>
        <div className="flex-1 h-px bg-neutral-200" />
      </div>
    );
  }

  /* ── AI messages — left-aligned, app-color bubble ── */
  if (isAI) {
    return (
      <div
        className="group relative px-4 sm:px-5 py-1.5"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Reply reference */}
        {message.replyTo && (
          <div className="flex items-center gap-2 mb-1 ml-11 pl-3 border-l-2 border-primary-200 max-w-xs">
            <span className="text-[11px] font-semibold text-primary-600 truncate">
              {message.replyTo.senderName}
            </span>
            <span className="text-[11px] text-neutral-400 truncate">
              {message.replyTo.content}
            </span>
          </div>
        )}

        <div className="flex items-end gap-2">
          {/* Bot avatar */}
          <div className="flex-shrink-0 mb-5 w-8">
            {showAvatar ? (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 shadow-sm ring-2 ring-primary-100">
                <Bot className="h-3.5 w-3.5 text-white" />
              </div>
            ) : (
              <div className="h-8 w-8" />
            )}
          </div>

          {/* Bubble */}
          <div className="max-w-[72%] flex flex-col items-start">
            {showAvatar && (
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-[12px] font-bold text-primary-700">
                  NovaAI
                </span>
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-gradient-to-r from-primary-100 to-accent-100 text-primary-700 flex items-center gap-0.5">
                  <Sparkles className="h-2.5 w-2.5" />
                  AI
                </span>
              </div>
            )}
            <div className="relative bg-primary-50/80 border border-primary-200/60 px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm">
              {/* Left accent bar */}
              <div className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-gradient-to-b from-primary-400 to-accent-400" />
              <div className="pl-1">
                {message.content && (
                  <p className="text-[13px] text-neutral-800 leading-relaxed whitespace-pre-wrap break-words">
                    {renderContent(message.content)}
                  </p>
                )}
                {message.attachments && message.attachments.length > 0 && (
                  <div className="mt-2 space-y-2">
                    {message.attachments.map((att) => (
                      <AttachmentView key={att.id} attachment={att} />
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Time */}
            <div className="flex items-center gap-1 mt-0.5 pl-0.5">
              <span className="text-[10px] text-neutral-400">
                {message.timestamp}
              </span>
              {message.isEdited && (
                <span className="text-[10px] text-neutral-400 italic">
                  · edited
                </span>
              )}
            </div>
            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1">
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
          </div>
        </div>

        {/* Hover action bar */}
        {hovering && (
          <div className="absolute -top-3 left-14 flex items-center gap-0.5 bg-white border border-neutral-200 rounded-lg shadow-lg px-1 py-0.5 z-10">
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
              title="More"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Own messages — right-aligned bubble ── */
  if (isOwn) {
    return (
      <div
        className="group relative px-4 sm:px-5 py-1.5"
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
      >
        {/* Reply reference */}
        {message.replyTo && (
          <div className="flex justify-end mb-1 mr-11">
            <div className="flex items-center gap-2 pl-3 border-l-2 border-primary-300 max-w-xs">
              <span className="text-[11px] font-semibold text-primary-600 truncate">
                {message.replyTo.senderName}
              </span>
              <span className="text-[11px] text-neutral-400 truncate">
                {message.replyTo.content}
              </span>
            </div>
          </div>
        )}

        <div className="flex items-end justify-end gap-2">
          {/* Bubble */}
          <div className="max-w-[70%] flex flex-col items-end">
            <div className="bg-primary-600 text-white px-4 py-2.5 rounded-2xl rounded-br-sm shadow-sm shadow-primary-500/20">
              {message.content && (
                <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words text-white">
                  {renderContent(message.content, true)}
                </p>
              )}
              {message.attachments && message.attachments.length > 0 && (
                <div className="mt-2 space-y-2">
                  {message.attachments.map((att) => (
                    <AttachmentView key={att.id} attachment={att} ownStyle />
                  ))}
                </div>
              )}
            </div>
            {/* Time + status */}
            <div className="flex items-center gap-1 mt-0.5 pr-0.5">
              <span className="text-[10px] text-neutral-400">
                {message.timestamp}
              </span>
              {message.isEdited && (
                <span className="text-[10px] text-neutral-400 italic">
                  · edited
                </span>
              )}
              {message.status === "read" ? (
                <CheckCheck className="h-3 w-3 text-primary-500" />
              ) : message.status === "delivered" ? (
                <CheckCheck className="h-3 w-3 text-neutral-400" />
              ) : message.status === "sent" ? (
                <Check className="h-3 w-3 text-neutral-400" />
              ) : null}
            </div>
            {/* Reactions */}
            {message.reactions && message.reactions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-1 justify-end">
                {message.reactions.map((r, i) => (
                  <button
                    key={i}
                    className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-all",
                      r.reacted
                        ? "bg-primary-50 border-primary-200 text-primary-700"
                        : "bg-white border-neutral-200 text-neutral-600 hover:border-primary-200",
                    )}
                  >
                    <span>{r.emoji}</span>
                    <span className="font-medium text-[10px]">{r.count}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Own avatar (small, optional) */}
          <div className="flex-shrink-0 mb-5">
            <Avatar
              name={message.sender.name}
              src={message.sender.avatar}
              size="sm"
              className="h-8 w-8 opacity-80"
            />
          </div>
        </div>

        {/* Hover action bar */}
        {hovering && (
          <div className="absolute -top-3 right-14 flex items-center gap-0.5 bg-white border border-neutral-200 rounded-lg shadow-lg px-1 py-0.5 z-10">
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
              title="More"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ── Others' messages — left-aligned bubble ── */
  const palette = getSenderPalette(message.sender.name);

  return (
    <div
      className="group relative px-4 sm:px-5 py-1.5"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Reply reference */}
      {message.replyTo && (
        <div className="flex items-center gap-2 mb-1 ml-11 pl-3 border-l-2 border-neutral-300 max-w-xs">
          <span className="text-[11px] font-semibold text-neutral-600 truncate">
            {message.replyTo.senderName}
          </span>
          <span className="text-[11px] text-neutral-400 truncate">
            {message.replyTo.content}
          </span>
        </div>
      )}

      <div className="flex items-end gap-2">
        {/* Avatar */}
        <div className="flex-shrink-0 mb-5 w-8">
          {showAvatar ? (
            <div className="relative">
              <Avatar
                name={message.sender.name}
                src={message.sender.avatar}
                size="sm"
                className="h-8 w-8"
              />
              {message.sender.isOnline && (
                <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-success-500 border-2 border-white" />
              )}
            </div>
          ) : (
            <div className="h-8 w-8" />
          )}
        </div>

        {/* Bubble */}
        <div className="max-w-[70%] flex flex-col items-start">
          {showAvatar && (
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[12px] font-bold text-neutral-800">
                {message.sender.name}
              </span>
              {message.sender.role === "admin" && (
                <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600">
                  Admin
                </span>
              )}
            </div>
          )}
          <div
            className={cn(
              "border px-4 py-2.5 rounded-2xl rounded-tl-sm shadow-sm",
              palette.bubble,
            )}
          >
            {message.content && (
              <p
                className={cn(
                  "text-[13px] leading-relaxed whitespace-pre-wrap break-words",
                  palette.text,
                )}
              >
                {renderContent(message.content)}
              </p>
            )}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mt-2 space-y-2">
                {message.attachments.map((att) => (
                  <AttachmentView key={att.id} attachment={att} />
                ))}
              </div>
            )}
            {message.linkPreview && (
              <div className="mt-2 max-w-sm rounded-xl border border-neutral-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer group/link">
                <div className="p-3">
                  <p className="text-[10px] font-semibold text-primary-500 uppercase tracking-wider mb-0.5">
                    {message.linkPreview.siteName || message.linkPreview.url}
                  </p>
                  <p className="text-xs font-bold text-neutral-900 line-clamp-2">
                    {message.linkPreview.title}
                  </p>
                  {message.linkPreview.description && (
                    <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                      {message.linkPreview.description}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          {/* Time */}
          <div className="flex items-center gap-1 mt-0.5 pl-0.5">
            <span className="text-[10px] text-neutral-400">
              {message.timestamp}
            </span>
            {message.isEdited && (
              <span className="text-[10px] text-neutral-400 italic">
                · edited
              </span>
            )}
          </div>
          {/* Reactions */}
          {message.reactions && message.reactions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-1">
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
        </div>
      </div>

      {/* Hover action bar */}
      {hovering && (
        <div className="absolute -top-3 left-14 flex items-center gap-0.5 bg-white border border-neutral-200 rounded-lg shadow-lg px-1 py-0.5 z-10">
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
function AttachmentView({
  attachment,
  ownStyle,
}: {
  attachment: MessageAttachment;
  ownStyle?: boolean;
}) {
  const [playing, setPlaying] = useState(false);
  const fileBg = ownStyle
    ? "bg-primary-700 border-primary-500"
    : "bg-neutral-50 border-neutral-200";
  const fileIconBg = ownStyle
    ? "bg-primary-500 text-white"
    : "bg-primary-100 text-primary-600";
  const textColor = ownStyle ? "text-white" : "text-neutral-900";
  const subColor = ownStyle ? "text-primary-200" : "text-neutral-400";
  const voiceBg = ownStyle ? "bg-primary-700" : "bg-neutral-100";
  const waveActive = ownStyle ? "bg-white" : "bg-primary-500";
  const waveInactive = ownStyle ? "bg-primary-400" : "bg-neutral-300";

  switch (attachment.type) {
    case "image":
      return (
        <div className="max-w-xs rounded-xl overflow-hidden border border-neutral-200 cursor-pointer hover:shadow-md transition-shadow">
          <div className="aspect-video bg-gradient-to-br from-neutral-100 to-neutral-200 flex items-center justify-center">
            {attachment.url ? (
              <img
                src={attachment.url}
                alt={attachment.name || "Image"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-neutral-400">
                <div className="h-10 w-10 rounded-lg bg-neutral-200 flex items-center justify-center">
                  📷
                </div>
                <span className="text-[10px]">
                  {attachment.name || "Image"}
                </span>
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
              <p className="text-xs font-medium text-neutral-900 truncate">
                {attachment.name}
              </p>
              {attachment.size && (
                <p className="text-[10px] text-neutral-400">
                  {attachment.size}
                </p>
              )}
            </div>
          )}
        </div>
      );

    case "voice":
      return (
        <div
          className={cn(
            "flex items-center gap-3 max-w-xs rounded-2xl px-3 py-2",
            voiceBg,
          )}
        >
          <button
            onClick={() => setPlaying(!playing)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-600 text-white hover:bg-primary-500 transition-colors flex-shrink-0"
          >
            {playing ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4 ml-0.5" />
            )}
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-end gap-[2px] h-6">
              {Array.from({ length: 28 }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-[3px] rounded-full transition-colors",
                    i < 12 ? waveActive : waveInactive,
                  )}
                  style={{ height: `${Math.random() * 100}%`, minHeight: 3 }}
                />
              ))}
            </div>
            <span className={cn("text-[10px] font-mono mt-0.5", subColor)}>
              {attachment.duration
                ? formatDuration(attachment.duration)
                : "0:00"}
            </span>
          </div>
        </div>
      );

    case "file":
      return (
        <div
          className={cn(
            "flex items-center gap-3 max-w-sm border rounded-xl p-3 hover:shadow-sm transition-shadow cursor-pointer group/file",
            fileBg,
          )}
        >
          <div
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0",
              fileIconBg,
            )}
          >
            <FileText className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-xs font-medium truncate", textColor)}>
              {attachment.name || "Document"}
            </p>
            <p className={cn("text-[10px]", subColor)}>
              {attachment.size || "Unknown size"}
            </p>
          </div>
          <button
            className={cn(
              "p-2 rounded-lg transition-colors opacity-0 group-hover/file:opacity-100",
              ownStyle
                ? "text-white hover:bg-primary-500"
                : "text-neutral-400 hover:text-primary-600 hover:bg-primary-50",
            )}
          >
            <Download className="h-4 w-4" />
          </button>
        </div>
      );

    default:
      return null;
  }
}
