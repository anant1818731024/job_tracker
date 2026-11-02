import { pgTable, text, timestamp, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { applicationsTable } from "./applications";

// type:   FOLLOW_UP | INTERVIEW | DEADLINE | CUSTOM
// status: PENDING | DONE | DISMISSED   (snoozing just moves dueAt)
// source: USER (created by hand) | AUTO (created on status change) | AI (reserved)
export const remindersTable = pgTable("reminders", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  applicationId: text("application_id").references(() => applicationsTable.id, { onDelete: "cascade" }),
  type: text("type").notNull().default("CUSTOM"),
  title: text("title").notNull(),
  note: text("note"),
  dueAt: timestamp("due_at").notNull(),
  status: text("status").notNull().default("PENDING"),
  source: text("source").notNull().default("USER"),
  completedAt: timestamp("completed_at"),
  notifiedAt: timestamp("notified_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (table) => [
  index("reminders_user_status_due_idx").on(table.userId, table.status, table.dueAt),
  index("reminders_application_idx").on(table.applicationId),
]);

export const insertReminderSchema = createInsertSchema(remindersTable).omit({ createdAt: true, updatedAt: true });
export type InsertReminder = z.infer<typeof insertReminderSchema>;
export type Reminder = typeof remindersTable.$inferSelect;
