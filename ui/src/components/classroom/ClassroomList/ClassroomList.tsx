import { useQuery } from "@tanstack/react-query";

import ClassroomCard, {
  type ClassroomCardData,
} from "@/components/classroom/ClassroomCard";
import { chatApi } from "@/lib/api/chat";
import type { Group } from "@/types";

function groupToCard(g: Group): ClassroomCardData {
  return {
    id: g.id,
    name: g.name,
    description: g.description ?? "",
    memberCount: g.member_count,
    progress: 0,
    subject: "Classroom",
  };
}

interface ClassroomListProps {
  /** Optional override – pass your own list instead of fetching. */
  classrooms?: ClassroomCardData[];
}

export default function ClassroomList({ classrooms }: ClassroomListProps) {
  const {
    data: groups,
    isLoading,
    isError,
  } = useQuery<Group[]>({
    queryKey: ["classrooms"],
    queryFn: () => chatApi.getMyGroups() as Promise<Group[]>,
    enabled: !classrooms,
  });

  const items: ClassroomCardData[] =
    classrooms ?? (groups ?? []).map(groupToCard);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="h-52 rounded-2xl bg-neutral-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-red-500">
          Failed to load classrooms. Please try again.
        </p>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="h-16 w-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <span className="text-2xl">📚</span>
        </div>
        <h3 className="font-display text-lg font-semibold text-neutral-900 mb-1">
          No classrooms yet
        </h3>
        <p className="text-sm text-neutral-500 max-w-sm">
          Join or create a classroom to start learning with your peers.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {items.map((c) => (
        <ClassroomCard key={c.id} classroom={c} />
      ))}
    </div>
  );
}
