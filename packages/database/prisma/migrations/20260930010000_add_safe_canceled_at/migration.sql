-- AlterTable
ALTER TABLE "safes" ADD COLUMN "canceled_at" DATE;

-- Cancelados por endosso de cancelamento: data do endosso.
UPDATE "safes" AS s
SET "canceled_at" = COALESCE(e."effectived_at", e."created_at"::date)
FROM (
  SELECT DISTINCT ON ("safe_id") "safe_id", "effectived_at", "created_at"
  FROM "endorsements"
  WHERE "type" = 'cancellation'
  ORDER BY "safe_id", "created_at" DESC
) AS e
WHERE s."id" = e."safe_id"
  AND s."status" = 'canceled';

-- Cancelados sem endosso (dados migrados): só conta como cancelamento se o
-- status mudou antes do fim da vigência; "canceled" depois disso é vigência
-- encerrada e fica com canceled_at nulo.
UPDATE "safes"
SET "canceled_at" = "status_at"::date
WHERE "status" = 'canceled'
  AND "canceled_at" IS NULL
  AND "status_at"::date < "expiration"
  AND NOT EXISTS (
    SELECT 1 FROM "endorsements" e
    WHERE e."safe_id" = "safes"."id" AND e."type" = 'cancellation'
  );

-- CreateIndex
CREATE INDEX "safes_broker_id_canceled_at_idx" ON "safes"("broker_id", "canceled_at");
