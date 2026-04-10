/*
  Warnings:

  - You are about to drop the column `percentageOfProduction` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `startOfProductionPayment` on the `members` table. All the data in the column will be lost.
  - You are about to drop the column `typeOfProductionPayment` on the `members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "members" DROP COLUMN "percentageOfProduction",
DROP COLUMN "startOfProductionPayment",
DROP COLUMN "typeOfProductionPayment",
ADD COLUMN     "percentage_of_production" SMALLINT,
ADD COLUMN     "start_of_production_payment" SMALLINT,
ADD COLUMN     "type_of_production_payment" "TypeOfProductionPayment";

-- AlterTable
ALTER TABLE "quote_vehicles" ADD COLUMN     "plate" VARCHAR(7);

-- AlterTable
ALTER TABLE "safe_vehicles" ADD COLUMN     "plate" VARCHAR(7);
