import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { AtSign, Mic, Paperclip, Send, Smile, X } from "lucide-react";
import {
    useEffect,
    useRef,
    useState,
    type FormEvent,
    type KeyboardEvent,
} from "react";

import { cn } from "@/lib/utils";

/* ── Types ─────────────────────────────────── */
interface ReplyContext {
  id: string;
  senderName: string;
  content: string;
}

interface ChatInputProps {
  onSend: (message: string, attachments?: File[]) => void;
  disabled?: boolean;
  replyTo?: ReplyContext | null;
  onCancelReply?: () => void;
  members?: { id: string; name: string }[];
}

export default function ChatInput({
  onSend,
  disabled,
  replyTo,
  onCancelReply,
  members = [],
}: ChatInputProps) {
  const [value, setValue] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionSearch, setMentionSearch] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const emojiRef = useRef<HTMLDivElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [value]);

  // Close emoji picker on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (emojiRef.current && !emojiRef.current.contains(e.target as Node)) {
        setShowEmoji(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Detect @mention typing
  useEffect(() => {
    const cursorPos = textareaRef.current?.selectionStart ?? 0;
    const textBefore = value.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);
    if (atMatch) {
      setShowMentions(true);
      setMentionSearch(atMatch[1]);
    } else {
      setShowMentions(false);
      setMentionSearch("");
    }
  }, [value]);

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed && files.length === 0) return;
    onSend(trimmed, files.length > 0 ? files : undefined);
    setValue("");
    setFiles([]);
    setShowEmoji(false);
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const insertEmoji = (emoji: string) => {
    const ta = textareaRef.current;
    if (ta) {
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const newVal = value.slice(0, start) + emoji + value.slice(end);
      setValue(newVal);
      setTimeout(() => {
        ta.selectionStart = ta.selectionEnd = start + emoji.length;
        ta.focus();
      }, 0);
    } else {
      setValue((v) => v + emoji);
    }
  };

  const insertMention = (name: string) => {
    const cursorPos = textareaRef.current?.selectionStart ?? value.length;
    const textBefore = value.slice(0, cursorPos);
    const newBefore = textBefore.replace(/@\w*$/, `@${name} `);
    setValue(newBefore + value.slice(cursorPos));
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const handleFiles = (fileList: FileList) => {
    setFiles((prev) => [...prev, ...Array.from(fileList)]);
  };

  const removeFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const filteredMembers = [{ id: "nova", name: "NovaAI" }, ...members].filter(
    (m) => m.name.toLowerCase().includes(mentionSearch.toLowerCase()),
  );

  return (
    <div className="border-t border-neutral-200/60 bg-white flex-shrink-0">
      {/* Reply preview */}
      {replyTo && (
        <div className="flex items-center gap-2 px-4 sm:px-5 py-2 bg-primary-50/50 border-b border-primary-100/50">
          <div className="w-1 h-8 bg-primary-500 rounded-full flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <span className="text-[11px] font-bold text-primary-600">
              {replyTo.senderName}
            </span>
            <p className="text-[11px] text-neutral-500 truncate">
              {replyTo.content}
            </p>
          </div>
          <button
            onClick={onCancelReply}
            className="p-1 rounded text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* File previews */}
      {files.length > 0 && (
        <div className="flex gap-2 px-4 sm:px-5 py-2 overflow-x-auto">
          {files.map((file, i) => (
            <div
              key={i}
              className="relative flex items-center gap-2 bg-neutral-100 rounded-lg px-3 py-2 pr-7 flex-shrink-0"
            >
              <Paperclip className="h-3.5 w-3.5 text-neutral-500" />
              <span className="text-[11px] font-medium text-neutral-700 max-w-[120px] truncate">
                {file.name}
              </span>
              <button
                onClick={() => removeFile(i)}
                className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 rounded text-neutral-400 hover:text-danger-500 transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="relative px-3 sm:px-4 py-2.5">
        {/* Mention suggestions */}
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-1 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-48 overflow-y-auto z-20">
            {filteredMembers.map((m) => (
              <button
                key={m.id}
                onClick={() => insertMention(m.name)}
                className="flex items-center gap-2.5 w-full px-3 py-2 text-xs hover:bg-primary-50 transition-colors text-left"
              >
                <AtSign className="h-3.5 w-3.5 text-primary-500" />
                <span className="font-medium text-neutral-700">{m.name}</span>
                {m.name === "NovaAI" && (
                  <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-primary-100 text-primary-600">
                    AI
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Emoji picker — emoji-mart */}
        {showEmoji && (
          <div
            ref={emojiRef}
            className="absolute bottom-full right-0 mb-2 z-20 shadow-2xl rounded-2xl overflow-hidden"
          >
            <Picker
              data={data}
              onEmojiSelect={(emoji: { native: string }) => {
                insertEmoji(emoji.native);
                setShowEmoji(false);
              }}
              theme="light"
              previewPosition="none"
              skinTonePosition="none"
              searchPosition="sticky"
              maxFrequentRows={2}
            />
          </div>
        )}

        <div className="flex items-end gap-2 bg-neutral-50/80 border border-neutral-200/80 rounded-2xl px-3 py-2 focus-within:border-primary-300 focus-within:ring-2 focus-within:ring-primary-100 transition-all">
          {/* Attachment button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex-shrink-0 mb-0.5"
            title="Attach file"
          >
            <Paperclip className="h-[18px] w-[18px]" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
          />

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={disabled}
            placeholder="Type a message… (@ to mention)"
            rows={1}
            className="flex-1 resize-none bg-transparent text-[13px] text-neutral-900 placeholder:text-neutral-400 focus:outline-none leading-relaxed max-h-[120px] py-1.5"
          />

          {/* Voice note */}
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-xl text-neutral-400 hover:text-primary-600 hover:bg-primary-50 transition-all flex-shrink-0 mb-0.5"
            title="Voice message"
          >
            <Mic className="h-[18px] w-[18px]" />
          </button>

          {/* Emoji button */}
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-xl transition-all flex-shrink-0 mb-0.5",
              showEmoji
                ? "text-primary-600 bg-primary-50"
                : "text-neutral-400 hover:text-primary-600 hover:bg-primary-50",
            )}
            title="Emoji"
          >
            <Smile className="h-[18px] w-[18px]" />
          </button>

          {/* Send button */}
          <button
            type="button"
            onClick={() => handleSubmit()}
            disabled={disabled || (!value.trim() && files.length === 0)}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary-600 text-white hover:bg-primary-500 disabled:opacity-40 disabled:pointer-events-none transition-all flex-shrink-0 mb-0.5 shadow-sm"
            title="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>

        <p className="text-[10px] text-neutral-400 mt-1 px-1">
          Press{" "}
          <kbd className="font-mono px-1 py-0.5 rounded bg-neutral-100 text-neutral-500">
            Enter
          </kbd>{" "}
          to send ·{" "}
          <kbd className="font-mono px-1 py-0.5 rounded bg-neutral-100 text-neutral-500">
            Shift+Enter
          </kbd>{" "}
          for new line
        </p>
      </div>
    </div>
  );
}
