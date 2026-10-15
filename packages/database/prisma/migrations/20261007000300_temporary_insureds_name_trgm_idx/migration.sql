-- CONCURRENTLY não roda em transação: um único comando por migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "temporary_insureds_name_trgm_idx" ON "temporary_insureds" USING gin ("name" gin_trgm_ops);
