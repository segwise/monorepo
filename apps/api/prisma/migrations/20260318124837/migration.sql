-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'admin', 'user', 'broker', 'producer', 'finance', 'counter');

-- CreateEnum
CREATE TYPE "ModalityInsurance" AS ENUM ('car');

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
CREATE TYPE "Garage" AS ENUM ('automatic_gate', 'manual_gate', 'private', 'no_garage');

-- CreateEnum
CREATE TYPE "GarageWork" AS ENUM ('yes', 'no', 'does_not_work', 'does_not_use');

-- CreateEnum
CREATE TYPE "GarageSchool" AS ENUM ('yes', 'no', 'does_not_study', 'does_not_use');

-- CreateEnum
CREATE TYPE "InsuranceCompanyContactCoverage" AS ENUM ('all_regions', 'capitals_and_metropolitan_regions');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN,
    "referral" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "banned" BOOLEAN,
    "ban_reason" TEXT,
    "ban_expires" DATE,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "user_id" UUID NOT NULL,
    "impersonated_by" TEXT,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "accounts" (
    "id" UUID NOT NULL,
    "scope" TEXT,
    "password" TEXT,
    "id_token" TEXT,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "account_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "refresh_token_expires_at" TIMESTAMP(3),
    "access_token_expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verifications" (
    "id" UUID NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "verifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "temporary_insureds" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" VARCHAR(13) NOT NULL,
    "cpf" VARCHAR(11),
    "birth" DATE,
    "age" INTEGER,
    "marital_status" "MaritalStatus",
    "qualification_time" INTEGER,
    "profession" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "temporary_insureds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insureds" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insureds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "plate" VARCHAR(7) NOT NULL,
    "plate_alternative" VARCHAR(7) NOT NULL,
    "manufacturer_id" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "model_year" INTEGER NOT NULL,
    "exchange" "VehicleExchange",
    "chassi" TEXT,
    "image" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles_without_plate" (
    "id" UUID NOT NULL,
    "manufacturer_id" UUID,
    "model" TEXT,
    "model_year" INTEGER,
    "exchange" "VehicleExchange",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vehicles_without_plate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quotes" (
    "id" UUID NOT NULL,
    "temporary_insured_id" UUID,
    "insured_id" UUID,
    "modality" "ModalityInsurance" NOT NULL,
    "renewal" BOOLEAN,
    "association" BOOLEAN,
    "insurance_company_id" UUID,
    "expiration" DATE,
    "franchise" DECIMAL(10,2),
    "status" "StatusQuote" NOT NULL DEFAULT 'waiting',
    "status_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_message" TEXT,
    "request_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_vehicles" (
    "id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "vehicle_id" UUID,
    "vehicle_without_plate_id" UUID,
    "usage" "VehicleUsage" NOT NULL,
    "overnight_postal_code" VARCHAR(8) NOT NULL,
    "resides_in" "Residence",
    "garage_of_the_residence" "Garage",
    "garage_at_work" "GarageWork",
    "garage_at_school" "GarageSchool",
    "armored" BOOLEAN,
    "gas_kit" BOOLEAN,
    "the_insured_is_the_owner" BOOLEAN,
    "funded" BOOLEAN,
    "drivers_under_26" BOOLEAN,
    "driver_cpf" VARCHAR(11),
    "driver_name" TEXT,
    "driver_birth" DATE,
    "driver_age" INTEGER,
    "driver_phone" VARCHAR(13),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quote_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_vehicles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "image" TEXT,
    "slugs" TEXT[],

    CONSTRAINT "manufacturer_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "image" TEXT,
    "cnpj" VARCHAR(14) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insurance_companies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_companies_categories_contacts" (
    "id" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "insurance_company_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insurance_companies_categories_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_companies_contacts" (
    "id" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "coverage" "InsuranceCompanyContactCoverage" NOT NULL,
    "value" VARCHAR(13) NOT NULL,
    "is_whatsapp" BOOLEAN,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insurance_companies_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_referral_key" ON "users"("referral");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_id_key" ON "accounts"("id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_alternative_key" ON "vehicles"("plate_alternative");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_plate_alternative_key" ON "vehicles"("plate", "plate_alternative");

-- CreateIndex
CREATE UNIQUE INDEX "quote_vehicles_vehicle_without_plate_id_key" ON "quote_vehicles"("vehicle_without_plate_id");

-- CreateIndex
CREATE UNIQUE INDEX "quote_vehicles_quote_id_key" ON "quote_vehicles"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_cnpj_key" ON "insurance_companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_categories_contacts_insurance_company_i_key" ON "insurance_companies_categories_contacts"("insurance_company_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_categories_contacts_index_key" ON "insurance_companies_categories_contacts"("index");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_contacts_category_id_value_key" ON "insurance_companies_contacts"("category_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_contacts_index_key" ON "insurance_companies_contacts"("index");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles_without_plate" ADD CONSTRAINT "vehicles_without_plate_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "temporary_insured" FOREIGN KEY ("temporary_insured_id") REFERENCES "temporary_insureds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_insured_id_fkey" FOREIGN KEY ("insured_id") REFERENCES "insureds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_vehicles" ADD CONSTRAINT "quote_vehicles_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_vehicles" ADD CONSTRAINT "quote_vehicles_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_vehicles" ADD CONSTRAINT "vehicle_without_plate" FOREIGN KEY ("vehicle_without_plate_id") REFERENCES "vehicles_without_plate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_companies_categories_contacts" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_companies_contacts" ADD CONSTRAINT "insurance_companies_contacts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "insurance_companies_categories_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
