-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'admin', 'user', 'broker', 'producer', 'finance', 'counter');

-- CreateEnum
CREATE TYPE "TypeInsurance" AS ENUM ('car');

-- CreateEnum
CREATE TYPE "StatusQuote" AS ENUM ('waiting', 'quoting', 'quoted', 'sent', 'recused', 'confirmed');

-- CreateEnum
CREATE TYPE "MaritalStatus" AS ENUM ('single', 'married', 'divorced', 'widowed', 'separated', 'common_law_marriage');

-- CreateEnum
CREATE TYPE "VehicleUsage" AS ENUM ('leisure_and_work', 'leisure', 'client_supplier_visits', 'app_based_transport', 'taxi', 'public_transportation', 'delivieries', 'tourism');

-- CreateEnum
CREATE TYPE "VehicleExchange" AS ENUM ('manual', 'automatic');

-- CreateEnum
CREATE TYPE "Residence" AS ENUM ('home', 'apartment', 'house_condominium', 'others');

-- CreateEnum
CREATE TYPE "Garage" AS ENUM ('automatic_gate', 'manual_gateprivate', 'no_garage');

-- CreateEnum
CREATE TYPE "GarageWork" AS ENUM ('yes', 'no', 'does_not_work', 'does_not_use');

-- CreateEnum
CREATE TYPE "GarageSchool" AS ENUM ('yes', 'no', 'does_not_study', 'does_not_use');

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "type" "TypeInsurance" NOT NULL,
    "renewal" BOOLEAN NOT NULL,
    "insured_id" UUID NOT NULL,
    "temporary_vehicle_id" UUID NOT NULL,
    "status" "StatusQuote" NOT NULL DEFAULT 'waiting',
    "status_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_message" TEXT,
    "request_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insureds" (
    "id" UUID NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "name" TEXT NOT NULL,
    "birth" DATE NOT NULL,
    "age" INTEGER NOT NULL,
    "phone" VARCHAR(13) NOT NULL,
    "marital_status" "MaritalStatus" NOT NULL,
    "qualification_time" INTEGER NOT NULL,
    "profession" TEXT,

    CONSTRAINT "insureds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_vehicles" (
    "id" UUID NOT NULL,
    "insured_id" UUID NOT NULL,
    "manufacturer_id" UUID NOT NULL,
    "plate" VARCHAR(7) NOT NULL,
    "model" TEXT NOT NULL,
    "model_year" INTEGER NOT NULL,
    "chassi" TEXT,
    "usage" "VehicleUsage" NOT NULL,
    "exchange" "VehicleExchange" NOT NULL,
    "overnight_postal_code" VARCHAR(8) NOT NULL,
    "resides_in" "Residence" NOT NULL,
    "garage_of_the_residence" "Garage" NOT NULL,
    "garage_at_work" "GarageWork" NOT NULL,
    "garage_at_school" "GarageSchool" NOT NULL,
    "armored" BOOLEAN NOT NULL,
    "gas_kit" BOOLEAN NOT NULL,
    "the_insured_is_the_owner" BOOLEAN NOT NULL,
    "funded" BOOLEAN NOT NULL,
    "drivers_under_26" BOOLEAN NOT NULL,
    "driver_cpf" VARCHAR(11) NOT NULL,
    "driver_name" TEXT NOT NULL,
    "driver_birth" DATE NOT NULL,
    "driver_age" INTEGER NOT NULL,
    "driver_phone" VARCHAR(13) NOT NULL,

    CONSTRAINT "temporary_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "icon" TEXT NOT NULL,

    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotes_type_idx" ON "quotes"("type");

-- CreateIndex
CREATE INDEX "quotes_type_status_idx" ON "quotes"("type", "status");

-- CreateIndex
CREATE INDEX "quotes_type_renewal_idx" ON "quotes"("type", "renewal");

-- CreateIndex
CREATE INDEX "quotes_type_renewal_status_idx" ON "quotes"("type", "renewal", "status");

-- CreateIndex
CREATE UNIQUE INDEX "quotes_id_key" ON "quotes"("id");

-- CreateIndex
CREATE UNIQUE INDEX "insureds_id_key" ON "insureds"("id");

-- CreateIndex
CREATE UNIQUE INDEX "insureds_cpf_key" ON "insureds"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_vehicles_plate_insured_id_key" ON "temporary_vehicles"("plate", "insured_id");

-- CreateIndex
CREATE INDEX "manufacturers_name_idx" ON "manufacturers"("name");

-- CreateIndex
CREATE UNIQUE INDEX "manufacturers_id_key" ON "manufacturers"("id");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_insured_id_fkey" FOREIGN KEY ("insured_id") REFERENCES "insureds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_temporary_vehicle_id_fkey" FOREIGN KEY ("temporary_vehicle_id") REFERENCES "temporary_vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_vehicles" ADD CONSTRAINT "temporary_vehicles_insured_id_fkey" FOREIGN KEY ("insured_id") REFERENCES "insureds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_vehicles" ADD CONSTRAINT "temporary_vehicles_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
