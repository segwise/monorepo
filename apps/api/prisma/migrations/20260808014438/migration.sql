-- AlterTable
ALTER TABLE "endorsements" ADD COLUMN     "amount" DECIMAL(10,2),
ADD COLUMN     "commission" DECIMAL(10,2),
ADD COLUMN     "franchise" DECIMAL(10,2),
ADD COLUMN     "percentage" SMALLINT;
