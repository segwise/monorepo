/*
  Warnings:

  - You are about to drop the column `status` on the `safes` table. All the data in the column will be lost.
  - You are about to drop the column `status_at` on the `safes` table. All the data in the column will be lost.
  - You are about to drop the column `status_message` on the `safes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "safes" DROP COLUMN "status",
DROP COLUMN "status_at",
DROP COLUMN "status_message";

-- DropEnum
DROP TYPE "StatusSafe";
