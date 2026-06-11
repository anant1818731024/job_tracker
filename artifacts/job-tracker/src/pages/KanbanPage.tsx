import { useState, useEffect } from "react";
// @ts-ignore
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Link } from "wouter";
import StatusBadge from "@/components/StatusBadge";
import { ApplicationWithHistory, ApplicationStatus, STATUS_COLORS } from "@/lib/types";
import { MapPin, Plus } from "lucide-react";
import { api } from "@/lib/api";

const COLUMNS: ApplicationStatus[] = ["APPLIED", "SCREENING", "INTERVIEW", "OFFER", "REJECTED"];

export default function KanbanPage() {
  const [grouped, setGrouped] = useState<Record<string, ApplicationWithHistory[]>>({});
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api.applications.list({ sortBy: "appliedDate", order: "desc" });
    const data: ApplicationWithHistory[] = await res.json();
    const g: Record<string, ApplicationWithHistory[]> = {};
    for (const col of COLUMNS) g[col] = [];
    for (const app of data) {
      if (g[app.status]) g[app.status].push(app);
      else if (!COLUMNS.includes(app.status as ApplicationStatus)) {
        // skip WITHDRAWN in kanban
      }
    }
    setGrouped(g);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function onDragEnd(result: DropResult) {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcCol = source.droppableId;
    const dstCol = destination.droppableId;
    const newGrouped = { ...grouped };
    const srcItems = Array.from(newGrouped[srcCol] ?? []);
    const [moved] = srcItems.splice(source.index, 1);
    newGrouped[srcCol] = srcItems;

    if (srcCol === dstCol) {
      srcItems.splice(destination.index, 0, moved);
      newGrouped[srcCol] = srcItems;
    } else {
      const dstItems = Array.from(newGrouped[dstCol] ?? []);
      dstItems.splice(destination.index, 0, { ...moved, status: dstCol });
      newGrouped[dstCol] = dstItems;
    }

    setGrouped(newGrouped);

    if (srcCol !== dstCol) {
      await api.applications.update(draggableId, { status: dstCol });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-12rem)]">
          {COLUMNS.map((col) => {
            const items = grouped[col] ?? [];
            return (
              <div key={col} className="flex-shrink-0 w-64 flex flex-col">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={col} />
                    <span className="text-xs text-gray-400 font-medium">{items.length}</span>
                  </div>
                </div>
                <Droppable droppableId={col}>
                  {(provided: any, snapshot: any) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex-1 rounded-xl p-2 min-h-[8rem] transition-colors ${
                        snapshot.isDraggingOver ? "bg-indigo-50 border-2 border-dashed border-indigo-300" : "bg-gray-100"
                      }`}
                    >
                      <div className="space-y-2">
                        {items.map((app, index) => (
                          <Draggable key={app.id} draggableId={app.id} index={index}>
                            {(provided: any, snapshot: any) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`bg-white rounded-lg border p-3 cursor-grab active:cursor-grabbing transition shadow-sm ${
                                  snapshot.isDragging
                                    ? "shadow-lg border-indigo-300 rotate-1"
                                    : "border-gray-200 hover:border-gray-300"
                                }`}
                              >
                                <Link
                                  href={`/applications/${app.id}`}
                                  onClick={(e: React.MouseEvent) => { if (snapshot.isDragging) e.preventDefault(); }}
                                >
                                  <p className="font-semibold text-sm text-gray-900 truncate">{app.company}</p>
                                  <p className="text-xs text-gray-500 truncate mt-0.5">{app.role}</p>
                                  {app.location && (
                                    <p className="text-xs text-gray-400 mt-1.5 flex items-center gap-1">
                                      <MapPin className="w-3 h-3" />{app.location}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1.5">
                                    {new Date(app.appliedDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                                  </p>
                                </Link>
                              </div>
                            )}
                          </Draggable>
                        ))}
                      </div>
                      {provided.placeholder}
                      {items.length === 0 && !snapshot.isDraggingOver && (
                        <p className="text-xs text-gray-400 text-center mt-4 px-2">Drop cards here</p>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
