-- CONCURRENTLY não roda em transação: um único comando por migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "quotes_broker_id_status_status_at_idx" ON "quotes" ("broker_id", "status", "status_at");
