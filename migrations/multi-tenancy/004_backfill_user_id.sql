-- Migration 004: Backfill all existing rows to "leo"
-- This runs inside a transaction with verification before COMMIT.
-- Run as: psql -U postgres -d financeapp -f 004_backfill_user_id.sql

BEGIN;

DO $$
DECLARE
  leo_id UUID;
BEGIN
  SELECT id INTO leo_id FROM users WHERE username = 'leo';

  IF leo_id IS NULL THEN
    RAISE EXCEPTION 'User leo not found — run migration 002 first';
  END IF;

  UPDATE transactions          SET user_id = leo_id WHERE user_id IS NULL;
  UPDATE budgets               SET user_id = leo_id WHERE user_id IS NULL;
  UPDATE goals                 SET user_id = leo_id WHERE user_id IS NULL;
  UPDATE finance_conversations SET user_id = leo_id WHERE user_id IS NULL;
  UPDATE chat_messages         SET user_id = leo_id WHERE user_id IS NULL;
  UPDATE alerts                SET user_id = leo_id WHERE user_id IS NULL;
  UPDATE user_profile          SET user_id = leo_id WHERE user_id IS NULL;
  UPDATE payee_mappings        SET user_id = leo_id WHERE user_id IS NULL;
  UPDATE payee_notes           SET user_id = leo_id WHERE user_id IS NULL;

  -- Verify every table has zero NULL user_ids
  IF (SELECT COUNT(*) FROM transactions          WHERE user_id IS NULL) > 0 THEN RAISE EXCEPTION 'transactions backfill incomplete'; END IF;
  IF (SELECT COUNT(*) FROM budgets               WHERE user_id IS NULL) > 0 THEN RAISE EXCEPTION 'budgets backfill incomplete'; END IF;
  IF (SELECT COUNT(*) FROM goals                 WHERE user_id IS NULL) > 0 THEN RAISE EXCEPTION 'goals backfill incomplete'; END IF;
  IF (SELECT COUNT(*) FROM finance_conversations WHERE user_id IS NULL) > 0 THEN RAISE EXCEPTION 'finance_conversations backfill incomplete'; END IF;
  IF (SELECT COUNT(*) FROM chat_messages         WHERE user_id IS NULL) > 0 THEN RAISE EXCEPTION 'chat_messages backfill incomplete'; END IF;
  IF (SELECT COUNT(*) FROM alerts                WHERE user_id IS NULL) > 0 THEN RAISE EXCEPTION 'alerts backfill incomplete'; END IF;
  IF (SELECT COUNT(*) FROM user_profile          WHERE user_id IS NULL) > 0 THEN RAISE EXCEPTION 'user_profile backfill incomplete'; END IF;
  IF (SELECT COUNT(*) FROM payee_mappings        WHERE user_id IS NULL) > 0 THEN RAISE EXCEPTION 'payee_mappings backfill incomplete'; END IF;
  IF (SELECT COUNT(*) FROM payee_notes           WHERE user_id IS NULL) > 0 THEN RAISE EXCEPTION 'payee_notes backfill incomplete'; END IF;

  RAISE NOTICE 'Backfill complete. All rows associated with user id: %', leo_id;
END $$;

COMMIT;
