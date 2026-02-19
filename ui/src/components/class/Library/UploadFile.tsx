import { CloudUpload } from "lucide-react";
import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";

interface UploadFileProps {
  onUpload?: (files: FileList) => void;
}

export default function UploadFile({ onUpload }: UploadFileProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        onUpload?.(e.dataTransfer.files);
      }
    },
    [onUpload],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload?.(e.target.files);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors cursor-pointer",
        isDragging
          ? "border-primary-500 bg-primary-50"
          : "border-neutral-200 bg-neutral-50 hover:border-primary-300 hover:bg-primary-50/50",
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100 text-primary-700">
        <CloudUpload className="h-6 w-6" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-neutral-700">
          Drag & drop files here, or{" "}
          <label className="text-primary-700 hover:text-primary-600 cursor-pointer font-semibold">
            browse
            <input
              type="file"
              multiple
              className="hidden"
              onChange={handleChange}
            />
          </label>
        </p>
        <p className="text-xs text-neutral-400 mt-1">
          PDF, Images, Docs up to 50MB
        </p>
      </div>
    </div>
  );
}
