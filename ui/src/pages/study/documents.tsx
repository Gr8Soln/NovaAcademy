import { documentsApi } from "@/lib/api";
import type { DocumentListResponse } from "@/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

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
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Documents</h1>
        <label className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 cursor-pointer">
          {uploading ? "Uploading..." : "Upload Document"}
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
        <div className="text-center py-12 text-gray-500">
          Loading documents...
        </div>
      ) : data?.documents.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-4xl mb-4">📄</p>
          <p>No documents yet. Upload your first study material!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {data?.documents.map((doc) => (
            <div
              key={doc.id}
              onClick={() => navigate(`/study/${doc.id}`)}
              className="bg-white rounded-xl p-5 shadow-sm border hover:border-primary-300 cursor-pointer transition"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">
                  {doc.file_type === "pdf"
                    ? "📕"
                    : doc.file_type === "docx"
                      ? "📘"
                      : doc.file_type === "pptx"
                        ? "📙"
                        : "📄"}
                </span>
                <h3 className="font-medium text-gray-900 truncate">
                  {doc.title}
                </h3>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{(doc.file_size_bytes / 1024).toFixed(0)} KB</span>
                <span
                  className={`px-2 py-0.5 rounded-full ${
                    doc.processing_status === "completed"
                      ? "bg-green-100 text-green-700"
                      : doc.processing_status === "processing"
                        ? "bg-yellow-100 text-yellow-700"
                        : doc.processing_status === "failed"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-700"
                  }`}
                >
                  {doc.processing_status}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                {new Date(doc.created_at).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
