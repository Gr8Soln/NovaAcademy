import { cn } from "@/lib/utils";

/* ─── Avatar ────────────────────────────────────────────────── */

const sizeClasses = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
} as const;

const gradients = [
  "from-primary-500 to-primary-700",
  "from-accent-500 to-accent-700",
  "from-primary-700 to-primary-900",
  "from-accent-300 to-accent-500",
  "from-success-500 to-primary-700",
  "from-primary-500 to-accent-500",
];

function hashName(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash << 5) - hash + name.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export interface AvatarProps {
  name: string;
  src?: string | null;
  size?: keyof typeof sizeClasses;
  className?: string;
}

export function Avatar({ name, src, size = "md", className }: AvatarProps) {
  const safeName = name || "";
  const initials = getInitials(safeName || "?");
  const gradient = gradients[hashName(safeName) % gradients.length];

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          "rounded-full object-cover flex-shrink-0",
          sizeClasses[size],
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "rounded-full flex-shrink-0 flex items-center justify-center bg-gradient-to-br text-white font-semibold",
        gradient,
        sizeClasses[size],
        className,
      )}
      title={name}
    >
      {initials}
    </div>
  );
}
