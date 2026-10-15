-- CONCURRENTLY não roda em transação: um único comando por migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "insureds_name_trgm_idx" ON "insureds" USING gin ("name" gin_trgm_ops);
