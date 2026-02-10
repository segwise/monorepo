/*
  Warnings:

  - You are about to drop the column `manufacturer_id` on the `temporary_vehicles` table. All the data in the column will be lost.
  - Added the required column `manufacturer` to the `temporary_vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "temporary_vehicles" DROP CONSTRAINT "temporary_vehicles_manufacturer_id_fkey";

-- AlterTable
ALTER TABLE "temporary_vehicles" DROP COLUMN "manufacturer_id",
ADD COLUMN     "manufacturer" TEXT NOT NULL;
