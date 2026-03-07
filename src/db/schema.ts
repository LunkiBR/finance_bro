import {
  pgTable,
  uuid,
  text,
  date,
  numeric,
  integer,
  serial,
  jsonb,
  timestamp,
  pgEnum,
  boolean,
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

export const categoryConfidenceEnum = pgEnum("category_confidence", [
  "high",
  "low",
  "manual",
]);

// ─── Transações ──────────────────────────────────────────────────────────────

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  date: date("date").notNull(),
  description: text("description").notNull(),
  beneficiary: text("beneficiary").notNull().default(""),
  category: text("category").notNull().default("Outros"),
  subcategory: text("subcategory"),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  source: text("source").notNull().default("nubank_cc"),
  month: text("month").notNull(),
  rawLine: text("raw_line"),
  categoryConfidence: categoryConfidenceEnum("category_confidence").default("high"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Motor de categorização ───────────────────────────────────────────────────

export const categoryRules = pgTable("category_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  keyword: text("keyword").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  type: transactionTypeEnum("type").notNull(),
  priority: integer("priority").notNull().default(0),
});

// ─── Orçamentos ───────────────────────────────────────────────────────────────

export const budgets = pgTable("budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  category: text("category").notNull(),
  month: text("month").notNull(),
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

// ─── Conversas ────────────────────────────────────────────────────────────────

export const conversations = pgTable("finance_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull().default("Nova conversa"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Chat com a IA ────────────────────────────────────────────────────────────
// NOTE: conversations table is renamed to finance_conversations to avoid
// conflict with the Supabase SaaS `conversations` table (client support convos)

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  conversationId: uuid("conversation_id"),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  chartSpec: jsonb("chart_spec"),
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

// ─── Perfil do Usuário ───────────────────────────────────────────────────────

export const userProfile = pgTable("user_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  nome: text("nome").notNull(),
  rendaMensal: numeric("renda_mensal", { precision: 10, scale: 2 }),
  dividaMensal: numeric("divida_mensal", { precision: 10, scale: 2 }),
  bancoPrincipal: text("banco_principal"),
  objetivoPrincipal: text("objetivo_principal"),
  temReserva: text("tem_reserva"),
  categoriasAltas: text("categorias_altas").array(),
  onboardingCompleto: boolean("onboarding_completo").notNull().default(false),
  aiNotes: text("ai_notes"), // Observações que a IA anota sobre o usuário
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Mapeamento de Favorecidos (cache da IA) ──────────────────────────────────

export const payeeMappings = pgTable("payee_mappings", {
  id: serial("id").primaryKey(),
  beneficiaryNormalized: text("beneficiary_normalized").unique().notNull(),
  beneficiaryDisplay: text("beneficiary_display"),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  confidence: text("confidence").notNull().default("ai"), // 'ai' | 'manual'
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Notas de Contexto para IA ───────────────────────────────────────────────

export const payeeNotes = pgTable("payee_notes", {
  id: serial("id").primaryKey(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
export type CategoryRule = typeof categoryRules.$inferSelect;
export type Budget = typeof budgets.$inferSelect;
export type Goal = typeof goals.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type Alert = typeof alerts.$inferSelect;
export type UserProfile = typeof userProfile.$inferSelect;
export type NewUserProfile = typeof userProfile.$inferInsert;
export type PayeeMapping = typeof payeeMappings.$inferSelect;
export type NewPayeeMapping = typeof payeeMappings.$inferInsert;
export type PayeeNote = typeof payeeNotes.$inferSelect;
