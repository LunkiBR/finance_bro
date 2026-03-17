/**
 * encrypt-existing-data.ts
 *
 * Migration script to encrypt all existing plaintext data in the database.
 * Safe to run multiple times (idempotent) — skips already-encrypted fields.
 *
 * Usage:
 *   npm run db:encrypt              # encrypt everything
 *   npm run db:encrypt -- --dry-run # preview only, no writes
 */

import { db } from "../db";
import {
  transactions,
  budgets,
  goals,
  chatMessages,
  payeeMappings,
  payeeNotes,
  userProfile,
  aiSummaries,
  alerts,
} from "../db/schema";
import { encrypt, isEncrypted, deterministicHash } from "../lib/encryption";
import { eq } from "drizzle-orm";

const DRY_RUN = process.argv.includes("--dry-run");
const BATCH_SIZE = 100;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function encryptIfNeeded(value: string | null | undefined): string | null {
  if (value == null || value === "") return null;
  if (isEncrypted(value)) return null; // already encrypted
  return encrypt(value);
}

function logTable(name: string, updated: number, skipped: number) {
  console.log(`  ${name}: ${updated} updated, ${skipped} skipped (already encrypted)`);
}

// ─── Table processors ─────────────────────────────────────────────────────────

async function encryptTransactions() {
  const rows = await db.select().from(transactions);
  let updated = 0,
    skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const updates: Record<string, string> = {};

      // Compute descriptionHash from plaintext BEFORE encrypting
      if ((!row.descriptionHash || row.descriptionHash === "") && row.description && !isEncrypted(row.description)) {
        updates.descriptionHash = deterministicHash(row.description);
      }

      const encDesc = encryptIfNeeded(row.description);
      if (encDesc) updates.description = encDesc;

      const encBen = encryptIfNeeded(row.beneficiary);
      if (encBen) updates.beneficiary = encBen;

      const encAmt = encryptIfNeeded(row.amount);
      if (encAmt) updates.amount = encAmt;

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await db.update(transactions).set(updates).where(eq(transactions.id, row.id));
        }
        updated++;
      } else {
        skipped++;
      }
    }
  }

  logTable("ff_transactions", updated, skipped);
}

async function encryptBudgets() {
  const rows = await db.select().from(budgets);
  let updated = 0,
    skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const updates: Record<string, string> = {};

      const encLimit = encryptIfNeeded(row.limitAmount);
      if (encLimit) updates.limitAmount = encLimit;

      const encSpent = encryptIfNeeded(row.spentAmount);
      if (encSpent) updates.spentAmount = encSpent;

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await db.update(budgets).set(updates).where(eq(budgets.id, row.id));
        }
        updated++;
      } else {
        skipped++;
      }
    }
  }

  logTable("ff_budgets", updated, skipped);
}

async function encryptGoals() {
  const rows = await db.select().from(goals);
  let updated = 0,
    skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const updates: Record<string, string> = {};

      const encName = encryptIfNeeded(row.name);
      if (encName) updates.name = encName;

      const encTarget = encryptIfNeeded(row.targetAmount);
      if (encTarget) updates.targetAmount = encTarget;

      const encCurrent = encryptIfNeeded(row.currentAmount);
      if (encCurrent) updates.currentAmount = encCurrent;

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await db.update(goals).set(updates).where(eq(goals.id, row.id));
        }
        updated++;
      } else {
        skipped++;
      }
    }
  }

  logTable("ff_goals", updated, skipped);
}

async function encryptChatMessages() {
  const rows = await db.select().from(chatMessages);
  let updated = 0,
    skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const updates: Record<string, string> = {};

      const encContent = encryptIfNeeded(row.content);
      if (encContent) updates.content = encContent;

      // chartSpec is jsonb/nullable — only encrypt if non-null
      if (row.chartSpec != null) {
        const specStr =
          typeof row.chartSpec === "string"
            ? row.chartSpec
            : JSON.stringify(row.chartSpec);
        if (!isEncrypted(specStr)) {
          updates.chartSpec = encrypt(specStr);
        }
      }

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await db.update(chatMessages).set(updates).where(eq(chatMessages.id, row.id));
        }
        updated++;
      } else {
        skipped++;
      }
    }
  }

  logTable("ff_chat_messages", updated, skipped);
}

async function encryptPayeeMappings() {
  const rows = await db.select().from(payeeMappings);
  let updated = 0,
    skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const updates: Record<string, string> = {};

      // Compute beneficiaryHash from plaintext BEFORE encrypting
      if (
        (!row.beneficiaryHash || row.beneficiaryHash === "") &&
        row.beneficiaryNormalized &&
        !isEncrypted(row.beneficiaryNormalized)
      ) {
        updates.beneficiaryHash = deterministicHash(row.beneficiaryNormalized);
      }

      const encNorm = encryptIfNeeded(row.beneficiaryNormalized);
      if (encNorm) updates.beneficiaryNormalized = encNorm;

      const encDisplay = encryptIfNeeded(row.beneficiaryDisplay);
      if (encDisplay) updates.beneficiaryDisplay = encDisplay;

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await db.update(payeeMappings).set(updates).where(eq(payeeMappings.id, row.id));
        }
        updated++;
      } else {
        skipped++;
      }
    }
  }

  logTable("ff_payee_mappings", updated, skipped);
}

async function encryptPayeeNotes() {
  const rows = await db.select().from(payeeNotes);
  let updated = 0,
    skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const updates: Record<string, string> = {};

      const encNote = encryptIfNeeded(row.note);
      if (encNote) updates.note = encNote;

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await db.update(payeeNotes).set(updates).where(eq(payeeNotes.id, row.id));
        }
        updated++;
      } else {
        skipped++;
      }
    }
  }

  logTable("ff_payee_notes", updated, skipped);
}

async function encryptUserProfile() {
  const rows = await db.select().from(userProfile);
  let updated = 0,
    skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const updates: Record<string, string> = {};

      const encNome = encryptIfNeeded(row.nome);
      if (encNome) updates.nome = encNome;

      // Nullable fields — only encrypt if non-null
      const encRenda = encryptIfNeeded(row.rendaMensal);
      if (encRenda) updates.rendaMensal = encRenda;

      const encDivida = encryptIfNeeded(row.dividaMensal);
      if (encDivida) updates.dividaMensal = encDivida;

      const encObjetivo = encryptIfNeeded(row.objetivoPrincipal);
      if (encObjetivo) updates.objetivoPrincipal = encObjetivo;

      const encAiNotes = encryptIfNeeded(row.aiNotes);
      if (encAiNotes) updates.aiNotes = encAiNotes;

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await db.update(userProfile).set(updates).where(eq(userProfile.id, row.id));
        }
        updated++;
      } else {
        skipped++;
      }
    }
  }

  logTable("ff_user_profile", updated, skipped);
}

async function encryptAiSummaries() {
  const rows = await db.select().from(aiSummaries);
  let updated = 0,
    skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const updates: Record<string, string> = {};

      const encContent = encryptIfNeeded(row.content);
      if (encContent) updates.content = encContent;

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await db.update(aiSummaries).set(updates).where(eq(aiSummaries.id, row.id));
        }
        updated++;
      } else {
        skipped++;
      }
    }
  }

  logTable("ff_ai_summaries", updated, skipped);
}

async function encryptAlerts() {
  const rows = await db.select().from(alerts);
  let updated = 0,
    skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);

    for (const row of batch) {
      const updates: Record<string, string> = {};

      const encMessage = encryptIfNeeded(row.message);
      if (encMessage) updates.message = encMessage;

      if (Object.keys(updates).length > 0) {
        if (!DRY_RUN) {
          await db.update(alerts).set(updates).where(eq(alerts.id, row.id));
        }
        updated++;
      } else {
        skipped++;
      }
    }
  }

  logTable("ff_alerts", updated, skipped);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN ===" : "=== ENCRYPTING EXISTING DATA ===");
  console.log("");

  await encryptTransactions();
  await encryptBudgets();
  await encryptGoals();
  await encryptChatMessages();
  await encryptPayeeMappings();
  await encryptPayeeNotes();
  await encryptUserProfile();
  await encryptAiSummaries();
  await encryptAlerts();

  console.log("");
  console.log(DRY_RUN ? "Dry run complete. No data was modified." : "Done! All data encrypted.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Encryption migration failed:", err);
  process.exit(1);
});
