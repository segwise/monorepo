/*
  Warnings:

  - You are about to drop the column `clientRegistration` on the `marketplace_vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `neighborhood` on the `marketplace_vehicles` table. All the data in the column will be lost.
  - Added the required column `direction` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `financial_state` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `insured_id` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `manufacturer` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `model_year` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `postal_code` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MarketplaceVehicleType" AS ENUM ('car', 'motorcycle');

-- CreateEnum
CREATE TYPE "MarketplaceVehicleDirection" AS ENUM ('hydraulics', 'electric', 'mechanics', 'assisted');

-- CreateEnum
CREATE TYPE "MarketplaceVehicleFinancialState" AS ENUM ('financed', 'settled');

-- CreateEnum
CREATE TYPE "MarketplaceVehicleFeature" AS ENUM ('air_barg', 'alarm', 'air_conditioning', 'electric_locks', 'electric_windows', 'sound', 'reverse_sensor', 'reversing_camera');

-- CreateEnum
CREATE TYPE "MarketplaceVehicleConservation" AS ENUM ('only_owner', 'with_manual', 'extra_key', 'reviewed', 'with_guarantee');

-- AlterTable
ALTER TABLE "marketplace_vehicles" DROP COLUMN "clientRegistration",
DROP COLUMN "neighborhood",
ADD COLUMN     "conservations" "MarketplaceVehicleConservation"[],
ADD COLUMN     "direction" "MarketplaceVehicleDirection" NOT NULL,
ADD COLUMN     "financial_state" "MarketplaceVehicleFinancialState" NOT NULL,
ADD COLUMN     "insured_id" UUID NOT NULL,
ADD COLUMN     "manufacturer" TEXT NOT NULL,
ADD COLUMN     "model_year" SMALLINT NOT NULL,
ADD COLUMN     "optionals" "MarketplaceVehicleFeature"[],
ADD COLUMN     "phone" VARCHAR(20) NOT NULL,
ADD COLUMN     "postal_code" VARCHAR(8) NOT NULL,
ADD COLUMN     "type" "MarketplaceVehicleType" NOT NULL;

-- CreateIndex
CREATE INDEX "marketplace_vehicles_insured_id_idx" ON "marketplace_vehicles"("insured_id");

-- CreateIndex
CREATE INDEX "marketplace_vehicles_type_idx" ON "marketplace_vehicles"("type");

-- AddForeignKey
ALTER TABLE "marketplace_vehicles" ADD CONSTRAINT "marketplace_vehicles_insured_id_fkey" FOREIGN KEY ("insured_id") REFERENCES "insureds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
