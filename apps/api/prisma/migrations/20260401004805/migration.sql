/*
  Warnings:

  - You are about to drop the column `implementation_at` on the `safes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "safes" DROP COLUMN "implementation_at",
ADD COLUMN     "effectived_at" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP;
