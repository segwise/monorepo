/*
  Warnings:

  - A unique constraint covering the columns `[broker_id,cnpj]` on the table `insureds` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "insureds" ADD COLUMN     "cnpj" VARCHAR(14),
ALTER COLUMN "cpf" DROP NOT NULL;

-- AlterTable
ALTER TABLE "temporary_insureds" ADD COLUMN     "cnpj" VARCHAR(14);

-- CreateIndex
CREATE INDEX "insureds_cnpj_idx" ON "insureds"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "insureds_broker_id_cnpj_key" ON "insureds"("broker_id", "cnpj");

-- CreateIndex
CREATE INDEX "temporary_insureds_cnpj_idx" ON "temporary_insureds"("cnpj");
