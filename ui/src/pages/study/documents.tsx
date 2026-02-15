import type { DocumentListResponse } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Upload } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/buttons";
import { Card, CardContent } from "@/components/ui/card";
import { SectionLoader } from "@/components/ui/loaders";
import { documentsApi } from "@/lib/api";

const fileIcon: Record<string, string> = {
  pdf: "text-danger-600 bg-danger-50",
  docx: "text-primary-600 bg-primary-50",
  pptx: "text-warning-600 bg-warning-50",
};

export default function DocumentsPage() {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<DocumentListResponse>({
    queryKey: ["documents"],
    queryFn: () => documentsApi.list() as Promise<DocumentListResponse>,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      await documentsApi.upload(file);
      queryClient.invalidateQueries({ queryKey: ["documents"] });
      toast.success("Document uploaded successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-primary-900">
            My Documents
          </h1>
          <p className="text-sm text-neutral-500">
            Upload study materials and start learning.
          </p>
        </div>
        <label className="cursor-pointer">
          <Button type="button" loading={uploading}>
            <Upload className="mr-1.5 h-4 w-4" />
            {uploading ? "Uploading..." : "Upload Document"}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.docx,.pptx,.txt,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {isLoading ? (
        <SectionLoader />
      ) : (data?.data ?? []).length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-100">
              <FileText className="h-7 w-7 text-neutral-400" />
            </div>
            <p className="font-medium text-neutral-700">No documents yet</p>
            <p className="mt-1 text-sm text-neutral-500">
              Upload your first study material to get started!
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.data?.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-md hover:border-primary-200 transition-all"
              onClick={() => navigate(`/study/${doc.id}`)}
            >
              <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${fileIcon[doc.file_type] ?? "text-neutral-600 bg-neutral-100"}`}
                  >
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="flex-1 text-sm font-medium text-neutral-900 truncate">
                    {doc.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">
                    {(doc.file_size_bytes / 1024).toFixed(0)} KB
                  </span>
                  <Badge
                    variant={
                      doc.processing_status === "completed"
                        ? "success"
                        : doc.processing_status === "processing"
                          ? "warning"
                          : doc.processing_status === "failed"
                            ? "danger"
                            : "default"
                    }
                  >
                    {doc.processing_status}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-neutral-400">
                  {new Date(doc.created_at).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
