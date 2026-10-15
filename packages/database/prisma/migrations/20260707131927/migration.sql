/*
  Warnings:

  - A unique constraint covering the columns `[id]` on the table `payment_payers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[broker_id,cpf]` on the table `temporary_insureds` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "payment_payers_id_key" ON "payment_payers"("id");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_insureds_broker_id_cpf_key" ON "temporary_insureds"("broker_id", "cpf");
