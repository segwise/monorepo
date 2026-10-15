/*
  Warnings:

  - You are about to alter the column `price` on the `marketplace_vehicles` table. The data in that column could be lost. The data in that column will be cast from `Decimal(12,2)` to `Decimal(10,2)`.
  - You are about to alter the column `plate` on the `marketplace_vehicles` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(7)`.

*/
-- AlterTable
ALTER TABLE "marketplace_vehicles" ALTER COLUMN "price" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "plate" SET DATA TYPE VARCHAR(7);
