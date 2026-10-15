-- CONCURRENTLY não roda em transação: um único comando por migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "marketplace_vehicles_model_trgm_idx" ON "marketplace_vehicles" USING gin ("model" gin_trgm_ops);
