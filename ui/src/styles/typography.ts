/**
 * Typography design tokens.
 * Headings use Poppins (semi-bold), body uses Inter (regular).
 * Applied via Tailwind utility classes; these constants are for reference/JS usage.
 */
export const typography = {
  fontFamily: {
    heading: "'Poppins', sans-serif",
    body: "'Inter', sans-serif",
    mono: "'JetBrains Mono', 'Fira Code', monospace",
  },
  fontWeight: {
    regular: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },
  fontSize: {
    xs: "0.75rem", // 12px
    sm: "0.875rem", // 14px
    base: "1rem", // 16px
    lg: "1.125rem", // 18px
    xl: "1.25rem", // 20px
    "2xl": "1.5rem", // 24px
    "3xl": "1.875rem", // 30px
    "4xl": "2.25rem", // 36px
  },
} as const;
