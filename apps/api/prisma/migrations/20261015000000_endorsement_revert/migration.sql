ALTER TABLE "endorsements"
  ADD COLUMN "snapshot" JSONB,
  ADD COLUMN "reverted_at" TIMESTAMPTZ,
  ADD COLUMN "reverted_by_id" UUID;
