-- CONCURRENTLY não roda em transação: um único comando por migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "endorsements_safe_id_created_at_idx" ON "endorsements" ("safe_id", "created_at");
