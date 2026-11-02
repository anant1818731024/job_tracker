export type ApplicationStatus =
  | "APPLIED"
  | "SCREENING"
  | "INTERVIEW"
  | "OFFER"
  | "REJECTED"
  | "WITHDRAWN";

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  INTERVIEW: "Interview",
  OFFER: "Offer",
  REJECTED: "Rejected",
  WITHDRAWN: "Withdrawn",
};

export const STATUS_COLORS: Record<ApplicationStatus, string> = {
  APPLIED: "bg-blue-100 text-blue-800",
  SCREENING: "bg-yellow-100 text-yellow-800",
  INTERVIEW: "bg-purple-100 text-purple-800",
  OFFER: "bg-green-100 text-green-800",
  REJECTED: "bg-red-100 text-red-800",
  WITHDRAWN: "bg-gray-100 text-gray-600",
};

export const STATUS_ORDER: ApplicationStatus[] = [
  "APPLIED",
  "SCREENING",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "WITHDRAWN",
];

export interface StatusHistory {
  id: string;
  applicationId: string;
  fromStatus: string | null;
  toStatus: string;
  changedAt: string;
  note: string | null;
}

export interface ApplicationWithHistory {
  id: string;
  company: string;
  role: string;
  jobUrl: string | null;
  location: string | null;
  salary: string | null;
  status: string;
  appliedDate: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  statusHistory: StatusHistory[];
}

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  isAdmin: boolean;
  emailVerifiedAt: string | null;
  mustVerify: boolean;
  verifyGraceEndsAt: string;
}

export type ReminderType = "FOLLOW_UP" | "INTERVIEW" | "DEADLINE" | "CUSTOM";
export type ReminderStatus = "PENDING" | "DONE" | "DISMISSED";

export const REMINDER_TYPE_LABELS: Record<ReminderType, string> = {
  FOLLOW_UP: "Follow-up",
  INTERVIEW: "Interview",
  DEADLINE: "Deadline",
  CUSTOM: "Reminder",
};

export interface Reminder {
  id: string;
  userId: string;
  applicationId: string | null;
  type: ReminderType;
  title: string;
  note: string | null;
  dueAt: string;
  status: ReminderStatus;
  source: "USER" | "AUTO" | "AI";
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  company: string | null;
  role: string | null;
}
