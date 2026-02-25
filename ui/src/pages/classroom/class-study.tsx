import StudyRoom from "@/pages/study/components/StudyRoom";
import { useParams } from "react-router-dom";

export default function ClassStudyPage() {
  const { classId } = useParams<{ classId: string }>();

  return (
    <div className="h-full">
      <StudyRoom mode="class" classId={classId} />
    </div>
  );
}
