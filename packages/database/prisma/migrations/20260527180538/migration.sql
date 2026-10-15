/*
  Warnings:

  - You are about to drop the column `acceptExchange` on the `marketplace_vehicles` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "MarketplaceVehicleAcceptExchangeAmount" AS ENUM ('down', 'up');

-- AlterTable
ALTER TABLE "marketplace_vehicles" DROP COLUMN "acceptExchange",
ADD COLUMN     "accept_exchange" BOOLEAN,
ADD COLUMN     "accept_exchange_amount" "MarketplaceVehicleAcceptExchangeAmount",
ADD COLUMN     "accept_exchange_change_1" TEXT,
ADD COLUMN     "accept_exchange_change_2" TEXT,
ADD COLUMN     "accept_exchange_change_3" TEXT;
