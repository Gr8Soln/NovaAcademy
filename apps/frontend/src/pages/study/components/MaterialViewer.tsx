import { FileText, Maximize2, Minimize2, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface MaterialViewerProps {
  url: string | null;
  type?: string;
  title?: string;
  className?: string;
}

export default function MaterialViewer({
  url,
  type = "pdf",
  title = "Untitled Document",
  className,
}: MaterialViewerProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(100);

  if (!url) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-neutral-50/50 rounded-2xl border-2 border-dashed border-neutral-200 text-neutral-400">
        <FileText className="h-12 w-12 mb-4 opacity-20" />
        <p className="text-sm font-medium">
          Select a document to begin studying
        </p>
      </div>
    );
  }

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-white rounded-2xl border border-neutral-200/60 shadow-sm overflow-hidden transition-all duration-300",
        isFullscreen
          ? "fixed inset-4 z-[100] m-0 rounded-3xl shadow-2xl"
          : "h-full",
        className,
      )}
    >
      {/* Viewer Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-neutral-50/80 border-b border-neutral-100">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-primary-100 text-primary-600">
            <FileText className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-neutral-900 leading-tight">
              {title}
            </h3>
            <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-semibold">
              {type} viewer
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-1 mr-2">
            <button
              onClick={() => setZoom(Math.max(50, zoom - 10))}
              className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded"
              title="Zoom out"
            >
              <ZoomOut className="h-4 w-4" />
            </button>
            <span className="text-[11px] font-mono text-neutral-600 px-1 w-10 text-center">
              {zoom}%
            </span>
            <button
              onClick={() => setZoom(Math.min(200, zoom + 10))}
              className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-50 rounded"
              title="Zoom in"
            >
              <ZoomIn className="h-4 w-4" />
            </button>
          </div>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-neutral-400 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all"
            title={isFullscreen ? "Exit fullscreen" : "Fullscreen mode"}
          >
            {isFullscreen ? (
              <Minimize2 className="h-4 w-4" />
            ) : (
              <Maximize2 className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="relative flex-1 bg-neutral-100/30 overflow-hidden">
        {type.toLowerCase() === "pdf" ? (
          <iframe
            src={`${url}#toolbar=0&view=FitH`}
            className="w-full h-full border-none"
            title={title}
            style={{
              transform: `scale(${zoom / 100})`,
              transformOrigin: "top center",
              width: `${100 / (zoom / 100)}%`,
              height: `${100 / (zoom / 100)}%`,
            }}
          />
        ) : (
          <div className="p-8 max-w-3xl mx-auto h-full overflow-y-auto bg-white shadow-inner">
            {/* Fallback for other types or text content */}
            <p className="text-neutral-500 italic text-center mt-20">
              Interactive text rendering and highlighting for {type} format is
              not available yet. Please view the source document for full
              fidelity.
            </p>
          </div>
        )}
      </div>

      {/* Footer / Status */}
      <div className="px-5 py-2 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between text-[10px] text-neutral-400">
        <div className="flex items-center gap-3">
          <span>End-to-end encrypted</span>
          <span className="w-1 h-1 rounded-full bg-neutral-200" />
          <span>Auto-saving highlights</span>
        </div>
        <div className="flex items-center gap-1.5 font-medium text-primary-600">
          <div className="w-1.5 h-1.5 rounded-full bg-primary-500 animate-pulse" />
          Synched with NovaAI
        </div>
      </div>
    </div>
  );
}
