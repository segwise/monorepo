-- CONCURRENTLY não roda em transação: um único comando por migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "safes_broker_id_requested_at_idx" ON "safes" ("broker_id", "requested_at");
