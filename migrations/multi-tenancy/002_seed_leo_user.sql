-- Migration 002: Seed first user "leo" (admin)
-- BEFORE running this, generate the bcrypt hash:
--   node -e "require('bcryptjs').hash('finance2026', 12).then(console.log)"
-- Then replace <BCRYPT_HASH> below with the output.
--
-- Run as: psql -U postgres -d financeapp -f 002_seed_leo_user.sql

INSERT INTO users (email, username, password_hash, name, role)
VALUES (
  'leo@elytraai.com.br',
  'leo',
  '<BCRYPT_HASH>',
  'Leonardo Rodrigues',
  'admin'
)
ON CONFLICT (username) DO NOTHING;
