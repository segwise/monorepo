/*
  Warnings:

  - You are about to drop the column `effectived_at` on the `endorsements` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[safe_id,type]` on the table `endorsements` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "endorsements" DROP COLUMN "effectived_at",
ADD COLUMN     "cancelled_at" DATE;

-- CreateIndex
CREATE UNIQUE INDEX "endorsements_safe_id_type_key" ON "endorsements"("safe_id", "type");
