/*
  Warnings:

  - You are about to drop the column `percentageOfProduction` on the `invitation` table. All the data in the column will be lost.
  - You are about to drop the column `startOfProductionPayment` on the `invitation` table. All the data in the column will be lost.
  - You are about to drop the column `typeOfProductionPayment` on the `invitation` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "invitation" DROP COLUMN "percentageOfProduction",
DROP COLUMN "startOfProductionPayment",
DROP COLUMN "typeOfProductionPayment",
ADD COLUMN     "percentage_of_production" SMALLINT,
ADD COLUMN     "start_of_production_payment" SMALLINT,
ADD COLUMN     "type_of_production_payment" "TypeOfProductionPayment";
