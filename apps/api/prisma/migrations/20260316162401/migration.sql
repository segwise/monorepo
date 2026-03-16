/*
  Warnings:

  - A unique constraint covering the columns `[cnpj]` on the table `insurance_companies` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_cnpj_key" ON "insurance_companies"("cnpj");
