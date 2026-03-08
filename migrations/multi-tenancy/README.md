# Multi-Tenancy Migrations

Rodar em ordem via SSH no VPS:

```bash
# 1. Backup primeiro
pg_dump -U postgres financeapp > backup_pre_multitenancy_$(date +%Y%m%d).sql

# 2. Gerar hash bcrypt da senha atual (rodar localmente ou no VPS)
node -e "require('bcryptjs').hash('finance2026', 12).then(console.log)"

# 3. Editar 002_seed_leo_user.sql e substituir <BCRYPT_HASH> pelo resultado acima

# 4. Rodar as migrations em ordem
psql -U postgres -d financeapp -f 001_create_users_table.sql
psql -U postgres -d financeapp -f 002_seed_leo_user.sql
psql -U postgres -d financeapp -f 003_add_user_id_columns.sql
psql -U postgres -d financeapp -f 004_backfill_user_id.sql
psql -U postgres -d financeapp -f 005_not_null_and_indexes.sql
```

## Verificação

Após rodar todas as migrations:
```sql
-- Verificar usuário criado
SELECT id, username, role FROM users;

-- Verificar zero NULLs (todas devem retornar 0)
SELECT COUNT(*) FROM transactions WHERE user_id IS NULL;
SELECT COUNT(*) FROM budgets WHERE user_id IS NULL;
SELECT COUNT(*) FROM goals WHERE user_id IS NULL;
SELECT COUNT(*) FROM finance_conversations WHERE user_id IS NULL;
SELECT COUNT(*) FROM chat_messages WHERE user_id IS NULL;
SELECT COUNT(*) FROM alerts WHERE user_id IS NULL;
SELECT COUNT(*) FROM user_profile WHERE user_id IS NULL;
SELECT COUNT(*) FROM payee_mappings WHERE user_id IS NULL;
SELECT COUNT(*) FROM payee_notes WHERE user_id IS NULL;
```
