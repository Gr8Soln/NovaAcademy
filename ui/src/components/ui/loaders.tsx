/** Full-page loader shown during lazy chunk loading */
export const PageLoader = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-primary-50 via-white to-blue-50">
    {/* Pulsing logo ring */}
    <div className="relative flex items-center justify-center mb-8">
      <span className="absolute inline-flex h-20 w-20 rounded-full bg-primary-400 opacity-20 animate-ping" />
      <span className="relative flex items-center justify-center h-20 w-20 rounded-full bg-primary-600 text-white text-3xl shadow-lg">
        🎓
      </span>
    </div>

    {/* Animated loading bar */}
    <div className="w-48 h-1.5 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-primary-500 via-blue-500 to-primary-500 rounded-full animate-loading-bar" />
    </div>

    <p className="mt-4 text-sm font-medium text-gray-500 tracking-wide animate-pulse">
      Loading&hellip;
    </p>
  </div>
);

/** Inline section loader for smaller areas (e.g. nested routes) */
export const SectionLoader = () => (
  <div className="flex flex-col items-center justify-center py-24">
    <div className="relative flex items-center justify-center mb-6">
      <span className="absolute inline-flex h-14 w-14 rounded-full bg-primary-400 opacity-20 animate-ping" />
      <span className="relative flex items-center justify-center h-14 w-14 rounded-full bg-primary-600 text-white text-xl shadow-md">
        🎓
      </span>
    </div>
    <div className="w-36 h-1 bg-gray-200 rounded-full overflow-hidden">
      <div className="h-full bg-gradient-to-r from-primary-500 via-blue-500 to-primary-500 rounded-full animate-loading-bar" />
    </div>
    <p className="mt-3 text-xs font-medium text-gray-400 tracking-wide animate-pulse">
      Loading&hellip;
    </p>
  </div>
);
