/*
  Warnings:

  - The primary key for the `marketplace_vehicles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `created_at` on the `marketplace_vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `gallery` on the `marketplace_vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `photo` on the `marketplace_vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `updated_at` on the `marketplace_vehicles` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[plate]` on the table `marketplace_vehicles` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `fuel` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `plate` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `transmission` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MarketplaceVehicleFuel" AS ENUM ('gasoline', 'ethanol', 'flex', 'diesel', 'electric', 'hybrid');

-- CreateEnum
CREATE TYPE "MarketplaceVehicleTransmission" AS ENUM ('manual', 'automatic', 'cvt', 'automated_manual');

-- CreateEnum
CREATE TYPE "MarketplaceVehicleStatus" AS ENUM ('active', 'paused', 'sold');

-- DropIndex
DROP INDEX "marketplace_vehicles_year_idx";

-- DropIndex
DROP INDEX "marketplace_vehicles_year_price_idx";

-- AlterTable
ALTER TABLE "marketplace_vehicles" DROP CONSTRAINT "marketplace_vehicles_pkey",
DROP COLUMN "created_at",
DROP COLUMN "gallery",
DROP COLUMN "photo",
DROP COLUMN "updated_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "fuel" "MarketplaceVehicleFuel" NOT NULL,
ADD COLUMN     "photos" TEXT[],
ADD COLUMN     "plate" TEXT NOT NULL,
ADD COLUMN     "status" "MarketplaceVehicleStatus" NOT NULL DEFAULT 'active',
ADD COLUMN     "transmission" "MarketplaceVehicleTransmission" NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "year" SET DATA TYPE TEXT,
ADD CONSTRAINT "marketplace_vehicles_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "marketplace_vehicles_plate_key" ON "marketplace_vehicles"("plate");

-- CreateIndex
CREATE INDEX "marketplace_vehicles_status_idx" ON "marketplace_vehicles"("status");

-- CreateIndex
CREATE INDEX "marketplace_vehicles_state_city_idx" ON "marketplace_vehicles"("state", "city");

-- CreateIndex
CREATE INDEX "marketplace_vehicles_price_idx" ON "marketplace_vehicles"("price");

-- CreateIndex
CREATE INDEX "marketplace_vehicles_fuel_idx" ON "marketplace_vehicles"("fuel");

-- CreateIndex
CREATE INDEX "marketplace_vehicles_transmission_idx" ON "marketplace_vehicles"("transmission");
