import ApplicationForm from "@/components/ApplicationForm";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function NewApplicationPage() {
  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/applications"
          className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-4"
        >
          <ChevronLeft className="w-4 h-4" /> Back to Applications
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">New Application</h1>
        <p className="text-gray-500 mt-1">Track a new job you&apos;ve applied to</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ApplicationForm />
      </div>
    </div>
  );
}
