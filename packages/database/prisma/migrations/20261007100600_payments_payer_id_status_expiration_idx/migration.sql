-- CONCURRENTLY não roda em transação: um único comando por migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payments_payer_id_status_expiration_idx" ON "payments" ("payer_id", "status", "expiration");
