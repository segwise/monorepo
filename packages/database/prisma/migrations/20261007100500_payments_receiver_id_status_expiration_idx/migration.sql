-- CONCURRENTLY não roda em transação: um único comando por migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "payments_receiver_id_status_expiration_idx" ON "payments" ("receiver_id", "status", "expiration");
