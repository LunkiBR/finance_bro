CREATE TYPE "public"."alert_type" AS ENUM('budget_80pct', 'budget_exceeded', 'goal_reminder');--> statement-breakpoint
CREATE TYPE "public"."category_confidence" AS ENUM('high', 'low', 'manual');--> statement-breakpoint
CREATE TYPE "public"."chat_role" AS ENUM('user', 'assistant');--> statement-breakpoint
CREATE TYPE "public"."goal_status" AS ENUM('active', 'completed', 'paused');--> statement-breakpoint
CREATE TYPE "public"."match_type" AS ENUM('contains', 'exact');--> statement-breakpoint
CREATE TYPE "public"."transaction_type" AS ENUM('receita', 'despesa');--> statement-breakpoint
CREATE TABLE "ff_alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" "alert_type" NOT NULL,
	"category" text NOT NULL,
	"message" text NOT NULL,
	"dismissed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_budgets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"category" text NOT NULL,
	"month" text NOT NULL,
	"limit_amount" numeric(10, 2) NOT NULL,
	"spent_amount" numeric(10, 2) DEFAULT '0' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_category_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"keyword" text NOT NULL,
	"category" text NOT NULL,
	"subcategory" text,
	"type" "transaction_type" NOT NULL,
	"priority" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"conversation_id" uuid,
	"role" "chat_role" NOT NULL,
	"content" text NOT NULL,
	"chart_spec" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_finance_conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" text DEFAULT 'Nova conversa' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_goals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" text NOT NULL,
	"target_amount" numeric(10, 2) NOT NULL,
	"current_amount" numeric(10, 2) DEFAULT '0' NOT NULL,
	"deadline" date,
	"status" "goal_status" DEFAULT 'active' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_payee_mappings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"beneficiary_normalized" text NOT NULL,
	"beneficiary_display" text,
	"category" text NOT NULL,
	"subcategory" text,
	"confidence" text DEFAULT 'ai' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_payee_notes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_transactions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"date" date NOT NULL,
	"description" text NOT NULL,
	"beneficiary" text DEFAULT '' NOT NULL,
	"category" text DEFAULT 'Outros' NOT NULL,
	"subcategory" text,
	"type" "transaction_type" NOT NULL,
	"amount" numeric(10, 2) NOT NULL,
	"source" text DEFAULT 'nubank_cc' NOT NULL,
	"month" text NOT NULL,
	"raw_line" text,
	"category_confidence" "category_confidence" DEFAULT 'high',
	"rule_id_applied" uuid,
	"is_manually_edited" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_user_category_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"match_type" "match_type" NOT NULL,
	"match_string" text NOT NULL,
	"target_category" text NOT NULL,
	"target_subcategory" text,
	"priority" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_user_profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"renda_mensal" numeric(10, 2),
	"divida_mensal" numeric(10, 2),
	"banco_principal" text,
	"objetivo_principal" text,
	"tem_reserva" text,
	"categorias_altas" text[],
	"onboarding_completo" boolean DEFAULT false NOT NULL,
	"ai_notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ff_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"username" varchar(100) NOT NULL,
	"password_hash" text NOT NULL,
	"name" varchar(200),
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "ff_users_email_unique" UNIQUE("email"),
	CONSTRAINT "ff_users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "ff_alerts" ADD CONSTRAINT "ff_alerts_user_id_ff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ff_budgets" ADD CONSTRAINT "ff_budgets_user_id_ff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ff_chat_messages" ADD CONSTRAINT "ff_chat_messages_user_id_ff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ff_finance_conversations" ADD CONSTRAINT "ff_finance_conversations_user_id_ff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ff_goals" ADD CONSTRAINT "ff_goals_user_id_ff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ff_payee_mappings" ADD CONSTRAINT "ff_payee_mappings_user_id_ff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ff_payee_notes" ADD CONSTRAINT "ff_payee_notes_user_id_ff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ff_transactions" ADD CONSTRAINT "ff_transactions_user_id_ff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ff_user_category_rules" ADD CONSTRAINT "ff_user_category_rules_user_id_ff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ff_user_profile" ADD CONSTRAINT "ff_user_profile_user_id_ff_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ff_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_payee_per_user" ON "ff_payee_mappings" USING btree ("user_id","beneficiary_normalized");