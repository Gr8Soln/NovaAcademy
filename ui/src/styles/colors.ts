/**
 * Design token constants for colors.
 * These mirror the Tailwind config for use in JS/TS when needed.
 */
export const colors = {
  primary: {
    50: "#EEF2FF",
    100: "#E0E7FF",
    200: "#C7D2FE",
    300: "#A5B4FC",
    400: "#818CF8",
    500: "#6366F1",
    600: "#4F46E5",
    700: "#3B5BDB",
    800: "#3730A3",
    900: "#1C2E8A",
  },
  secondary: {
    400: "#FBBF24",
    500: "#F59E0B",
    600: "#D97706",
  },
  accent: {
    400: "#34D399",
    500: "#10B981",
    600: "#059669",
  },
  neutral: {
    50: "#F9FAFB",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    700: "#374151",
    900: "#111827",
    950: "#0F172A",
  },
  danger: {
    500: "#EF4444",
    600: "#DC2626",
  },
  success: {
    500: "#10B981",
    600: "#059669",
  },
} as const;
