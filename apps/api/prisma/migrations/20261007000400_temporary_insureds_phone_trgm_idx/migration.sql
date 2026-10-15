-- CONCURRENTLY não roda em transação: um único comando por migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "temporary_insureds_phone_trgm_idx" ON "temporary_insureds" USING gin ("phone" gin_trgm_ops);
