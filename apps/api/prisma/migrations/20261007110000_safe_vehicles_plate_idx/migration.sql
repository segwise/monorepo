-- CONCURRENTLY não roda em transação: um único comando por migration.
CREATE INDEX CONCURRENTLY IF NOT EXISTS "safe_vehicles_plate_idx" ON "safe_vehicles" ("plate");
