/*
  Warnings:

  - A unique constraint covering the columns `[previous_safe_id]` on the table `safes` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "safes" ADD COLUMN     "previous_safe_id" UUID,
ADD COLUMN     "renewal" BOOLEAN;

-- CreateIndex
CREATE UNIQUE INDEX "safes_previous_safe_id_key" ON "safes"("previous_safe_id");

-- AddForeignKey
ALTER TABLE "safes" ADD CONSTRAINT "previous_safe" FOREIGN KEY ("previous_safe_id") REFERENCES "safes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
