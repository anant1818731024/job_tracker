import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { applicationsTable } from "./applications";

export const statusHistoryTable = pgTable("status_history", {
  id: text("id").primaryKey(),
  applicationId: text("application_id").notNull().references(() => applicationsTable.id, { onDelete: "cascade" }),
  fromStatus: text("from_status"),
  toStatus: text("to_status").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
  note: text("note"),
});

export const insertStatusHistorySchema = createInsertSchema(statusHistoryTable).omit({ changedAt: true });
export type InsertStatusHistory = z.infer<typeof insertStatusHistorySchema>;
export type StatusHistory = typeof statusHistoryTable.$inferSelect;
