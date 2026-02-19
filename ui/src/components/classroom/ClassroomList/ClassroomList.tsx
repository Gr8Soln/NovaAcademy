import ClassroomCard, {
  type ClassroomCardData,
} from "@/components/classroom/ClassroomCard";

// ── Mock data ───────────────────────────────────────────────
const mockClassrooms: ClassroomCardData[] = [
  {
    id: "cls-1",
    name: "Introduction to Machine Learning",
    description:
      "Learn the fundamentals of ML including supervised and unsupervised learning, neural networks, and model evaluation.",
    memberCount: 34,
    progress: 72,
    subject: "Computer Science",
  },
  {
    id: "cls-2",
    name: "Organic Chemistry II",
    description:
      "Advanced organic chemistry covering reaction mechanisms, stereochemistry, and spectroscopy techniques.",
    memberCount: 28,
    progress: 45,
    subject: "Chemistry",
  },
  {
    id: "cls-3",
    name: "Data Structures & Algorithms",
    description:
      "Master essential data structures like trees, graphs, and hash maps. Practice algorithm design and complexity analysis.",
    memberCount: 41,
    progress: 88,
    subject: "Computer Science",
  },
  {
    id: "cls-4",
    name: "Calculus III — Multivariable",
    description:
      "Explore partial derivatives, multiple integrals, vector fields, and theorems of Green, Stokes, and Gauss.",
    memberCount: 22,
    progress: 30,
    subject: "Mathematics",
  },
  {
    id: "cls-5",
    name: "Principles of Economics",
    description:
      "Covers micro and macroeconomic theory, market structures, fiscal & monetary policy, and international trade.",
    memberCount: 56,
    progress: 60,
    subject: "Economics",
  },
  {
    id: "cls-6",
    name: "Modern World History",
    description:
      "A survey of global events from the 18th century to the present, focusing on revolutions, wars, and cultural shifts.",
    memberCount: 19,
    progress: 15,
    subject: "History",
  },
];

interface ClassroomListProps {
  classrooms?: ClassroomCardData[];
}

export default function ClassroomList({
  classrooms = mockClassrooms,
}: ClassroomListProps) {
  if (classrooms.length === 0) {
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
      {classrooms.map((c) => (
        <ClassroomCard key={c.id} classroom={c} />
      ))}
    </div>
  );
}
