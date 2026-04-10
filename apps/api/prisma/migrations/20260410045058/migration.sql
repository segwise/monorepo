-- AlterTable
ALTER TABLE "invitation" ADD COLUMN     "percentageOfProduction" SMALLINT,
ADD COLUMN     "referral" TEXT,
ADD COLUMN     "startOfProductionPayment" SMALLINT,
ADD COLUMN     "typeOfProductionPayment" "TypeOfProductionPayment",
ADD COLUMN     "type_of_production" "TypeOfProduction";
