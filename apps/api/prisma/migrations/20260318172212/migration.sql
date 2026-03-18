-- CreateEnum
CREATE TYPE "StatusSafe" AS ENUM ('waiting', 'quoting', 'quoted', 'sent', 'recused', 'confirmed');

-- DropForeignKey
ALTER TABLE "quote_vehicles" DROP CONSTRAINT "quote_vehicles_vehicle_id_fkey";

-- DropForeignKey
ALTER TABLE "quote_vehicles" DROP CONSTRAINT "vehicle_without_plate";

-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "insurance_company";

-- CreateTable
CREATE TABLE "safes" (
    "id" UUID NOT NULL,
    "insured_id" UUID NOT NULL,
    "modality" "ModalityInsurance" NOT NULL,
    "insurance_company_id" UUID NOT NULL,
    "expiration" DATE NOT NULL,
    "status" "StatusSafe" NOT NULL DEFAULT 'waiting',
    "status_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_message" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "safes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safe_vehicles" (
    "id" UUID NOT NULL,
    "safe_id" UUID NOT NULL,
    "vehicle_id" UUID NOT NULL,
    "vehicle_without_plate_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "safe_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "safe_vehicles_vehicle_without_plate_id_key" ON "safe_vehicles"("vehicle_without_plate_id");

-- CreateIndex
CREATE UNIQUE INDEX "safe_vehicles_safe_id_key" ON "safe_vehicles"("safe_id");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safes" ADD CONSTRAINT "safes_insured_id_fkey" FOREIGN KEY ("insured_id") REFERENCES "insureds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safes" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_vehicles" ADD CONSTRAINT "quote_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_vehicles" ADD CONSTRAINT "vehicle_without_plate" FOREIGN KEY ("vehicle_without_plate_id") REFERENCES "vehicles_without_plate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safe_vehicles" ADD CONSTRAINT "safe_vehicles_safe_id_fkey" FOREIGN KEY ("safe_id") REFERENCES "safes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safe_vehicles" ADD CONSTRAINT "safe_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safe_vehicles" ADD CONSTRAINT "vehicle_without_plate" FOREIGN KEY ("vehicle_without_plate_id") REFERENCES "vehicles_without_plate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
