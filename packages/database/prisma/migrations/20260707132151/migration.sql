/*
  Warnings:

  - A unique constraint covering the columns `[broker_id,cnpj]` on the table `temporary_insureds` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "temporary_insureds_broker_id_cnpj_key" ON "temporary_insureds"("broker_id", "cnpj");
