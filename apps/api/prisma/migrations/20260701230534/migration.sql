/*
  Warnings:

  - A unique constraint covering the columns `[externalId]` on the table `safes` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "safes_externalId_key" ON "safes"("externalId");
