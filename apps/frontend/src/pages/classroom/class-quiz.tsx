import { QuizList } from "@/components/class/Quiz";

export default function ClassQuizPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <QuizList />
      </div>
    </div>
  );
}
