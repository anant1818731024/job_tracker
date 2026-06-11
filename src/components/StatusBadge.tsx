"use client";

import { STATUS_COLORS, STATUS_LABELS, ApplicationStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: string }) {
  const color = STATUS_COLORS[status as ApplicationStatus] ?? "bg-gray-100 text-gray-600";
  const label = STATUS_LABELS[status as ApplicationStatus] ?? status;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}
