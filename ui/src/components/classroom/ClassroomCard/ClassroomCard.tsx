import { BookOpen, TrendingUp, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { cn } from "@/lib/utils";

export interface ClassroomCardData {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  progress: number; // 0-100
  subject: string;
  color?: string;
}

interface ClassroomCardProps {
  classroom: ClassroomCardData;
  className?: string;
}

export default function ClassroomCard({
  classroom,
  className,
}: ClassroomCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/class/${classroom.id}`)}
      className={cn(
        "group relative bg-white rounded-2xl shadow-sm border border-neutral-200 p-6 overflow-hidden",
        "hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer",
        className,
      )}
    >
      {/* Color accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary-700" />

      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-50 text-primary-700 group-hover:bg-primary-100 transition-colors">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-semibold text-neutral-900 group-hover:text-primary-700 transition-colors">
              {classroom.name}
            </h3>
            <span className="text-xs text-neutral-500">
              {classroom.subject}
            </span>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-neutral-600 mb-4 line-clamp-2">
        {classroom.description}
      </p>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-medium text-neutral-500">Progress</span>
          <span className="text-xs font-semibold text-primary-700">
            {classroom.progress}%
          </span>
        </div>
        <div className="w-full h-2 bg-neutral-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary-700 rounded-full transition-all duration-500"
            style={{ width: `${classroom.progress}%` }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-neutral-400">
        <div className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          <span>{classroom.memberCount} members</span>
        </div>
        <div className="flex items-center gap-1 text-success-500">
          <TrendingUp className="h-3.5 w-3.5" />
          <span>Active</span>
        </div>
      </div>
    </div>
  );
}
