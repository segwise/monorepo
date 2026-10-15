/*
  Warnings:

  - You are about to alter the column `phone` on the `marketplace_vehicles` table. The data in that column could be lost. The data in that column will be cast from `VarChar(20)` to `VarChar(13)`.

*/
-- AlterTable
ALTER TABLE "marketplace_vehicles" ALTER COLUMN "phone" SET DATA TYPE VARCHAR(13);

-- AlterTable
ALTER TABLE "safes" ALTER COLUMN "effectived_at" SET DATA TYPE DATE;
