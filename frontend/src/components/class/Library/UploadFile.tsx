import { useMutation } from "@tanstack/react-query";
import { CloudUpload, Loader2, Sparkles } from "lucide-react";
import { useCallback, useState } from "react";

import { documentsApi } from "@/lib/api/documents";
import { cn } from "@/lib/utils";

interface UploadFileProps {
  classCode: string;
  onUploadSuccess?: () => void;
}

export default function UploadFile({ classCode, onUploadSuccess }: UploadFileProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const { mutateAsync: uploadFile } = useMutation({
    mutationFn: (file: File) => documentsApi.upload(classCode, file),
  });

  const handleUpload = useCallback(
    async (files: FileList) => {
      setIsUploading(true);
      try {
        const uploadPromises = Array.from(files).map((file) => uploadFile(file));
        await Promise.all(uploadPromises);
        onUploadSuccess?.();
      } catch (error) {
        console.error("Upload failed:", error);
      } finally {
        setIsUploading(false);
      }
    },
    [uploadFile, onUploadSuccess],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [handleUpload],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
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
        "relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all cursor-pointer overflow-hidden",
        isDragging
          ? "border-primary-500 bg-primary-50 scale-[1.01]"
          : "border-neutral-200 bg-gradient-to-br from-neutral-50 to-white hover:border-primary-300 hover:bg-primary-50/30 hover:shadow-sm",
        isUploading && "pointer-events-none opacity-80",
      )}
    >
      {/* Decorative sparkles */}
      <Sparkles className="absolute top-4 right-4 h-4 w-4 text-primary-200 opacity-50" />
      <Sparkles className="absolute bottom-4 left-4 h-3 w-3 text-accent-200 opacity-50" />

      <div
        className={cn(
          "flex h-14 w-14 items-center justify-center rounded-2xl transition-all",
          isDragging || isUploading
            ? "bg-primary-600 text-white shadow-lg shadow-primary-600/30 scale-110"
            : "bg-primary-100 text-primary-600",
        )}
      >
        {isUploading ? (
          <Loader2 className="h-7 w-7 animate-spin" />
        ) : (
          <CloudUpload className="h-7 w-7" />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-neutral-700">
          {isUploading ? "Uploading study materials..." : "Drag & drop files here, or "}
          {!isUploading && (
            <label className="text-primary-600 hover:text-primary-500 cursor-pointer font-bold underline underline-offset-2">
              browse
              <input
                type="file"
                multiple
                className="hidden"
                disabled={isUploading}
                onChange={handleChange}
              />
            </label>
          )}
        </p>
        <p className="text-[11px] text-neutral-400 mt-1.5">
          PDF, DOCX, TXT, MD up to 50MB
        </p>
      </div>
    </div>
  );
}
