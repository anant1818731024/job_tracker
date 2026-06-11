import KanbanBoard from "@/components/KanbanBoard";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Kanban Board</h1>
          <p className="text-gray-500 mt-0.5">Drag and drop to update status</p>
        </div>
        <Link
          href="/applications/new"
          className="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition"
        >
          <Plus className="w-4 h-4" />
          Add Application
        </Link>
      </div>
      <KanbanBoard />
    </div>
  );
}
