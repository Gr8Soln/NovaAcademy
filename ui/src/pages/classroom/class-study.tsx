import StudyRoom from "@/pages/study/components/StudyRoom";
import { useParams } from "react-router-dom";

export default function ClassStudyPage() {
  const { classId, documentId } = useParams<{ classId: string; documentId?: string }>();

  return (
    <div className="h-full">
      <StudyRoom mode="class" classId={classId} initialDocId={documentId} />
    </div>
  );
}
