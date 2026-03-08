-- Migration 005: Add NOT NULL constraints, drop old unique constraint, create new indexes
-- Run AFTER migration 004 completes successfully.
-- Run as: psql -U postgres -d financeapp -f 005_not_null_and_indexes.sql

-- Add NOT NULL constraints
ALTER TABLE transactions          ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE budgets               ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE goals                 ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE finance_conversations ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE chat_messages         ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE alerts                ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE user_profile          ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payee_mappings        ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE payee_notes           ALTER COLUMN user_id SET NOT NULL;

-- Drop old global unique constraint on payee_mappings (was global, now per-user compound)
ALTER TABLE payee_mappings DROP CONSTRAINT IF EXISTS payee_mappings_beneficiary_normalized_unique;

-- Compound unique indexes (per-user)
CREATE UNIQUE INDEX IF NOT EXISTS uq_transactions_per_user
  ON transactions(user_id, date, description, amount, source);

CREATE UNIQUE INDEX IF NOT EXISTS uq_budgets_per_user
  ON budgets(user_id, category, month);

CREATE UNIQUE INDEX IF NOT EXISTS uq_user_profile_per_user
  ON user_profile(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payee_per_user
  ON payee_mappings(user_id, beneficiary_normalized);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_month  ON transactions(user_id, month);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month        ON budgets(user_id, month);
CREATE INDEX IF NOT EXISTS idx_goals_user                ON goals(user_id);
CREATE INDEX IF NOT EXISTS idx_alerts_user               ON alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user        ON finance_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_user        ON chat_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_payee_mappings_user       ON payee_mappings(user_id);
