import { LibraryList } from "@/components/class/Library";

export default function ClassLibraryPage() {
  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 md:p-6 lg:p-8 max-w-[1400px] mx-auto">
        <LibraryList />
      </div>
    </div>
  );
}
