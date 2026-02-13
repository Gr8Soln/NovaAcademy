import { GraduationCap } from "lucide-react";

/** Full-page loader shown during lazy chunk loading */
export const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-neutral-50 via-white to-primary-50">
    {/* Pulsing logo ring */}
    <div className="relative flex items-center justify-center mb-8">
      <span className="absolute inline-flex h-20 w-20 rounded-full bg-primary-400 opacity-20 animate-ping" />
      <span className="relative flex items-center justify-center h-20 w-20 rounded-full bg-primary-700 text-white shadow-lg">
        <GraduationCap className="h-9 w-9" />
      </span>
    </div>

    {/* Animated loading bar */}
    <div className="w-48 h-1.5 bg-neutral-200 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-full animate-loading-bar" />
    </div>

    <p className="mt-4 text-sm font-medium text-neutral-500 tracking-wide animate-pulse">
      Loading&hellip;
    </p>
  </div>
);

/** Inline section loader for smaller areas (e.g. nested routes) */
export const SectionLoader = () => (
  <div className="flex flex-col items-center justify-center py-24">
    <div className="relative flex items-center justify-center mb-6">
      <span className="absolute inline-flex h-14 w-14 rounded-full bg-primary-400 opacity-20 animate-ping" />
      <span className="relative flex items-center justify-center h-14 w-14 rounded-full bg-primary-700 text-white shadow-md">
        <GraduationCap className="h-6 w-6" />
      </span>
    </div>
    <div className="w-36 h-1 bg-neutral-200 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-primary-500 via-accent-500 to-primary-500 rounded-full animate-loading-bar" />
    </div>
    <p className="mt-3 text-xs font-medium text-neutral-400 tracking-wide animate-pulse">
      Loading&hellip;
    </p>
  </div>
);
