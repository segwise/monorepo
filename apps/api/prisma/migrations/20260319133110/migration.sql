/*
  Warnings:

  - You are about to drop the column `association` on the `safes` table. All the data in the column will be lost.
  - You are about to drop the column `renewal` on the `safes` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "safes" DROP COLUMN "association",
DROP COLUMN "renewal";
