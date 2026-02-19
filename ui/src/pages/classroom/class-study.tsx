import { StudyInterface } from "@/components/class/Study";

export default function ClassStudyPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1200px] mx-auto">
        <StudyInterface />
      </div>
    </div>
  );
}
