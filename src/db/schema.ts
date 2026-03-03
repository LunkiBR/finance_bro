import {
  pgTable,
  uuid,
  text,
  date,
  numeric,
  integer,
  jsonb,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const transactionTypeEnum = pgEnum("transaction_type", [
  "receita",
  "despesa",
]);

export const goalStatusEnum = pgEnum("goal_status", [
  "active",
  "completed",
  "paused",
]);

export const alertTypeEnum = pgEnum("alert_type", [
  "budget_80pct",
  "budget_exceeded",
  "goal_reminder",
]);

export const chatRoleEnum = pgEnum("chat_role", ["user", "assistant"]);

// ─── Transações ──────────────────────────────────────────────────────────────

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  beneficiary: text("beneficiary").notNull().default(""),
  category: text("category").notNull().default("Outros"),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  source: text("source").notNull().default("nubank_cc"), // nubank_cc | nubank_conta
  month: text("month").notNull(), // 'jan/26'
  rawLine: text("raw_line"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Motor de categorização ───────────────────────────────────────────────────

export const categoryRules = pgTable("category_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  keyword: text("keyword").notNull(),
  category: text("category").notNull(),
  type: transactionTypeEnum("type").notNull(),
  priority: integer("priority").notNull().default(0),
});

// ─── Orçamentos ───────────────────────────────────────────────────────────────

export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull(),
  month: text("month").notNull(), // 'jan/26'
  limitAmount: numeric("limit_amount", { precision: 10, scale: 2 }).notNull(),
  spentAmount: numeric("spent_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
});

// ─── Metas ────────────────────────────────────────────────────────────────────

export const goals = pgTable("goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  deadline: date("deadline"),
  status: goalStatusEnum("status").notNull().default("active"),
});

// ─── Chat com a IA ────────────────────────────────────────────────────────────

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  chartSpec: jsonb("chart_spec"), // null se sem gráfico inline
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Alertas ─────────────────────────────────────────────────────────────────

export const alerts = pgTable("alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  type: alertTypeEnum("type").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type CategoryRule = typeof categoryRules.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
