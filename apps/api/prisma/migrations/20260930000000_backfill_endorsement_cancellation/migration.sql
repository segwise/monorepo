-- Só dados, sem mudança de estrutura. Seguros cancelados por endosso de
-- cancelamento ficaram sem motivo e com status_at na data de criação do seguro
-- (o endpoint não gravava esses campos). Idempotente: só toca em quem ainda não
-- tem motivo.
UPDATE "safes" AS s
SET
  "status_message" = 'Cancelado por endosso',
  "status_at" = COALESCE(e."effectived_at", e."created_at")
FROM (
  SELECT DISTINCT ON ("safe_id") "safe_id", "effectived_at", "created_at"
  FROM "endorsements"
  WHERE "type" = 'cancellation'
  ORDER BY "safe_id", "created_at" DESC
) AS e
WHERE s."id" = e."safe_id"
  AND s."status" = 'canceled'
  AND s."status_message" IS NULL;
