-- AlterTable
ALTER TABLE "vehicles_without_plate" ALTER COLUMN "manufacturer_id" DROP NOT NULL,
ALTER COLUMN "model" DROP NOT NULL,
ALTER COLUMN "model_year" DROP NOT NULL,
ALTER COLUMN "exchange" DROP NOT NULL;
