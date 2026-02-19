import { cn } from "@/lib/utils";

interface HighlightedTextProps {
  text: string;
  highlights?: { start: number; end: number; color?: string }[];
  className?: string;
}

export default function HighlightedText({
  text,
  highlights = [],
  className,
}: HighlightedTextProps) {
  if (highlights.length === 0) {
    return (
      <p
        className={cn(
          "text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap",
          className,
        )}
      >
        {text}
      </p>
    );
  }

  // Sort highlights by start position
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const segments: React.ReactNode[] = [];
  let cursor = 0;

  sorted.forEach((hl, idx) => {
    if (hl.start > cursor) {
      segments.push(
        <span key={`t-${idx}`}>{text.slice(cursor, hl.start)}</span>,
      );
    }
    segments.push(
      <mark
        key={`h-${idx}`}
        className={cn(
          "rounded px-0.5",
          hl.color || "bg-accent-200 text-accent-900",
        )}
      >
        {text.slice(hl.start, hl.end)}
      </mark>,
    );
    cursor = hl.end;
  });

  if (cursor < text.length) {
    segments.push(<span key="tail">{text.slice(cursor)}</span>);
  }

  return (
    <p
      className={cn(
        "text-sm text-neutral-700 leading-relaxed whitespace-pre-wrap",
        className,
      )}
    >
      {segments}
    </p>
  );
}
