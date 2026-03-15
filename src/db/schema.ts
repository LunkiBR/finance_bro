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
  varchar,
  uniqueIndex,
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

export const matchTypeEnum = pgEnum("match_type", ["contains", "exact"]);

// ─── Users ────────────────────────────────────────────────────────────────────

export const users = pgTable("ff_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).unique().notNull(),
  username: varchar("username", { length: 100 }).unique().notNull(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 200 }),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Transações ──────────────────────────────────────────────────────────────

export const transactions = pgTable("ff_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  ruleIdApplied: uuid("rule_id_applied"),
  isManuallyEdited: boolean("is_manually_edited").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Motor de categorização (global) ──────────────────────────────────────────
// category_rules is global (no user_id) — shared across all users

export const categoryRules = pgTable("ff_category_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  keyword: text("keyword").notNull(),
  category: text("category").notNull(),
  subcategory: text("subcategory"),
  type: transactionTypeEnum("type").notNull(),
  priority: integer("priority").notNull().default(0),
});

// ─── Regras de categorização do usuário ──────────────────────────────────────

export const userCategoryRules = pgTable("ff_user_category_rules", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  matchType: matchTypeEnum("match_type").notNull(),
  matchString: text("match_string").notNull(),
  targetCategory: text("target_category").notNull(),
  targetSubcategory: text("target_subcategory"),
  priority: integer("priority").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Orçamentos ───────────────────────────────────────────────────────────────

export const budgets = pgTable("ff_budgets", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  category: text("category").notNull(),
  month: text("month").notNull(),
  limitAmount: numeric("limit_amount", { precision: 10, scale: 2 }).notNull(),
  spentAmount: numeric("spent_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
});

// ─── Metas ────────────────────────────────────────────────────────────────────

export const goals = pgTable("ff_goals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  targetAmount: numeric("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentAmount: numeric("current_amount", { precision: 10, scale: 2 })
    .notNull()
    .default("0"),
  deadline: date("deadline"),
  status: goalStatusEnum("status").notNull().default("active"),
});

// ─── Conversas ────────────────────────────────────────────────────────────────

export const conversations = pgTable("ff_finance_conversations", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Nova conversa"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ─── Chat com a IA ────────────────────────────────────────────────────────────
// NOTE: conversations table is renamed to finance_conversations to avoid
// conflict with the Supabase SaaS `conversations` table (client support convos)

export const chatMessages = pgTable("ff_chat_messages", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  conversationId: uuid("conversation_id"),
  role: chatRoleEnum("role").notNull(),
  content: text("content").notNull(),
  chartSpec: jsonb("chart_spec"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Alertas ─────────────────────────────────────────────────────────────────

export const alerts = pgTable("ff_alerts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: alertTypeEnum("type").notNull(),
  category: text("category").notNull(),
  message: text("message").notNull(),
  dismissedAt: timestamp("dismissed_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Perfil do Usuário ───────────────────────────────────────────────────────

export const userProfile = pgTable("ff_user_profile", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  nome: text("nome").notNull(),
  rendaMensal: numeric("renda_mensal", { precision: 10, scale: 2 }),
  dividaMensal: numeric("divida_mensal", { precision: 10, scale: 2 }),
  bancoPrincipal: text("banco_principal"),
  objetivoPrincipal: text("objetivo_principal"),
  temReserva: text("tem_reserva"),
  categoriasAltas: text("categorias_altas").array(),
  onboardingCompleto: boolean("onboarding_completo").notNull().default(false),
  aiNotes: text("ai_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Mapeamento de Favorecidos (cache da IA) ──────────────────────────────────
// Per-user: each user builds their own payee mappings

export const payeeMappings = pgTable(
  "ff_payee_mappings",
  {
    id: serial("id").primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    beneficiaryNormalized: text("beneficiary_normalized").notNull(),
    beneficiaryDisplay: text("beneficiary_display"),
    category: text("category").notNull(),
    subcategory: text("subcategory"),
    confidence: text("confidence").notNull().default("ai"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_payee_per_user").on(table.userId, table.beneficiaryNormalized),
  ]
);

// ─── Notas de Contexto para IA ───────────────────────────────────────────────

export const payeeNotes = pgTable("ff_payee_notes", {
  id: serial("id").primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Categorias Personalizadas do Usuário ────────────────────────────────────
// Per-user custom categories with AI context for smart categorization

export const userCategories = pgTable(
  "ff_user_categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    type: text("type").notNull().default("despesa"), // despesa | receita | ambos
    parent: text("parent"), // NULL = root category, "Alimentação" = subcategory of that
    subcategories: text("subcategories").array().default([]),
    colorBg: text("color_bg"),
    colorText: text("color_text"),
    colorDot: text("color_dot"),
    icon: text("icon").notNull().default("Tag"), // Lucide icon name
    aiContext: text("ai_context"), // "Restaurante Universitário da UNICAMP"
    aiExamples: text("ai_examples").array().default([]), // ["RU UNICAMP", "REST UNIVERSITARIO"]
    sortOrder: integer("sort_order").default(100),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_user_category_name").on(table.userId, table.name),
  ]
);

// ─── Sínteses da IA (geradas após importação) ────────────────────────────────

export const aiSummaries = pgTable("ff_ai_summaries", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  month: text("month").notNull(),
  generatedAt: timestamp("generated_at").defaultNow().notNull(),
});

// ─── TypeScript Types ─────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
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
export type UserCategoryRule = typeof userCategoryRules.$inferSelect;
export type NewUserCategoryRule = typeof userCategoryRules.$inferInsert;
export type AiSummary = typeof aiSummaries.$inferSelect;
export type UserCategory = typeof userCategories.$inferSelect;
export type NewUserCategory = typeof userCategories.$inferInsert;
