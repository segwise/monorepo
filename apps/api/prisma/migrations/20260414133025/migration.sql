-- CreateEnum
CREATE TYPE "Role" AS ENUM ('owner', 'admin', 'manager', 'broker', 'finance', 'counter', 'producer', 'customer');

-- CreateEnum
CREATE TYPE "ModalityInsurance" AS ENUM ('car');

-- CreateEnum
CREATE TYPE "StatusQuote" AS ENUM ('waiting', 'quoting', 'quoted', 'sent', 'recused', 'confirmed');

-- CreateEnum
CREATE TYPE "StatusSafe" AS ENUM ('canceled', 'suspended', 'active');

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

-- CreateEnum
CREATE TYPE "TypeOfCommission" AS ENUM ('by_the_brokerage_commission', 'by_the_net_premium', 'fixed_value');

-- CreateEnum
CREATE TYPE "TypeOfInterest" AS ENUM ('simple', 'compound');

-- CreateEnum
CREATE TYPE "StatusInvitation" AS ENUM ('pending', 'expired', 'accepted');

-- CreateEnum
CREATE TYPE "StatusPayment" AS ENUM ('waiting', 'paid', 'expired', 'canceled');

-- CreateEnum
CREATE TYPE "MethodPayment" AS ENUM ('pix', 'billet', 'transfer', 'species', 'credit_card');

-- CreateEnum
CREATE TYPE "TypeOfProduction" AS ENUM ('gym', 'accountants', 'driving_school', 'university', 'condominium_management', 'oil_change', 'youtuber', 'promoters', 'digital_marketing', 'buying_group', 'gas_station', 'restaurant', 'producers', 'influencer', 'producer', 'syndicate');

-- CreateEnum
CREATE TYPE "TypeOfProductionPayment" AS ENUM ('weekly', 'bi_weekly', 'monthly');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" BOOLEAN,
    "cpf" VARCHAR(11),
    "cnpj" VARCHAR(14),
    "phone" VARCHAR(13),
    "role" "Role" NOT NULL,
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
    "active_broker_id" UUID,
    "impersonated_by" UUID,
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
    "cnpj" VARCHAR(14),
    "birth" DATE,
    "age" SMALLINT,
    "marital_status" "MaritalStatus",
    "qualification_time" SMALLINT,
    "broker_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "temporary_insureds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insureds" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" VARCHAR(13) NOT NULL,
    "cpf" VARCHAR(11),
    "cnpj" VARCHAR(14),
    "birth" DATE NOT NULL,
    "age" SMALLINT NOT NULL,
    "marital_status" "MaritalStatus" NOT NULL,
    "qualification_time" SMALLINT,
    "broker_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insureds_pkey" PRIMARY KEY ("id")
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
    "broker_id" UUID NOT NULL,
    "expiration" DATE,
    "franchise" DECIMAL(10,2),
    "producer_id" UUID,
    "status" "StatusQuote" NOT NULL DEFAULT 'waiting',
    "status_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_message" TEXT,
    "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quotes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safes" (
    "id" UUID NOT NULL,
    "is_external" BOOLEAN,
    "producer_id" UUID,
    "temporary_insured_id" UUID,
    "insured_id" UUID,
    "modality" "ModalityInsurance" NOT NULL,
    "renewal" BOOLEAN,
    "previous_safe_id" UUID,
    "insurance_company_id" UUID,
    "broker_id" UUID NOT NULL,
    "expiration" DATE NOT NULL,
    "installments" SMALLINT,
    "award" DECIMAL(10,2),
    "franchise" DECIMAL(10,2),
    "commission" DECIMAL(10,2),
    "commission_amount" DECIMAL(10,2),
    "commission_of_type" "TypeOfCommission",
    "commission_percentage" SMALLINT,
    "commission_discount_percentage" SMALLINT,
    "commission_discount_fixed" DECIMAL(10,2),
    "commission_installments" SMALLINT,
    "commission_amount_producer" DECIMAL(10,2),
    "commission_monthly_interest" SMALLINT,
    "commission_pay_interest_starting" SMALLINT,
    "commission_type_of_interest" "TypeOfInterest",
    "commission_payment_date" TIMESTAMPTZ,
    "commission_gross" DECIMAL(10,2),
    "commission_net" DECIMAL(10,2),
    "status" "StatusSafe" NOT NULL DEFAULT 'active',
    "status_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status_message" TEXT,
    "requested_at" TIMESTAMPTZ NOT NULL,
    "effectived_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "safes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "quote_vehicles" (
    "id" UUID NOT NULL,
    "quote_id" UUID NOT NULL,
    "plate" VARCHAR(7),
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
    "driver_age" SMALLINT,
    "driver_phone" VARCHAR(13),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "quote_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "safe_vehicles" (
    "id" UUID NOT NULL,
    "safe_id" UUID NOT NULL,
    "plate" VARCHAR(7),
    "vehicle_id" UUID,
    "vehicle_without_plate_id" UUID,
    "usage" "VehicleUsage" NOT NULL,
    "overnight_postal_code" VARCHAR(8) NOT NULL,
    "driver_cpf" VARCHAR(11),
    "driver_name" TEXT,
    "driver_birth" DATE,
    "driver_age" SMALLINT,
    "driver_phone" VARCHAR(13),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "safe_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" UUID NOT NULL,
    "plate" VARCHAR(7) NOT NULL,
    "plate_alternative" VARCHAR(7) NOT NULL,
    "manufacturer_id" UUID NOT NULL,
    "model" TEXT NOT NULL,
    "model_year" SMALLINT NOT NULL,
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
    "model_year" SMALLINT,
    "exchange" "VehicleExchange",
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "vehicles_without_plate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "manufacturer_vehicles" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "image" TEXT,
    "slugs" TEXT[],
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "manufacturer_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "fantasy" TEXT,
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
    "index" SMALLINT NOT NULL,
    "label" TEXT NOT NULL,
    "insurance_company_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insurance_companies_categories_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "insurance_companies_contacts" (
    "id" UUID NOT NULL,
    "index" SMALLINT NOT NULL,
    "coverage" "InsuranceCompanyContactCoverage" NOT NULL,
    "value" VARCHAR(13) NOT NULL,
    "is_whatsapp" BOOLEAN,
    "category_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insurance_companies_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brokers" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "fantasy" TEXT,
    "cnpj" VARCHAR(14) NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "image" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "brokers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "members" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "broker_id" UUID NOT NULL,
    "role" "Role" NOT NULL,
    "referral" TEXT,
    "type_of_production" "TypeOfProduction",
    "percentage_of_production" SMALLINT,
    "type_of_production_payment" "TypeOfProductionPayment",
    "start_of_production_payment" SMALLINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitation" (
    "id" UUID NOT NULL,
    "broker_id" UUID,
    "email" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "referral" TEXT,
    "type_of_production" "TypeOfProduction",
    "percentage_of_production" SMALLINT,
    "type_of_production_payment" "TypeOfProductionPayment",
    "start_of_production_payment" SMALLINT,
    "status" "StatusInvitation" NOT NULL DEFAULT 'pending',
    "inviter_id" UUID NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_payers" (
    "id" UUID NOT NULL,
    "broker_id" UUID,
    "insurance_company_id" UUID,
    "user_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_payers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "receiver_id" UUID,
    "payer_id" UUID,
    "method" "MethodPayment" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "amount_paid" DECIMAL(10,2),
    "description" TEXT,
    "installment" SMALLINT,
    "related_payment_id" UUID,
    "status" "StatusPayment" NOT NULL,
    "expiration" TIMESTAMPTZ NOT NULL,
    "paid_at" TIMESTAMPTZ,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_cpf_key" ON "users"("cpf");

-- CreateIndex
CREATE UNIQUE INDEX "users_cnpj_key" ON "users"("cnpj");

-- CreateIndex
CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

-- CreateIndex
CREATE INDEX "sessions_active_broker_id_idx" ON "sessions"("active_broker_id");

-- CreateIndex
CREATE INDEX "sessions_impersonated_by_idx" ON "sessions"("impersonated_by");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_id_key" ON "accounts"("id");

-- CreateIndex
CREATE INDEX "verifications_identifier_idx" ON "verifications"("identifier");

-- CreateIndex
CREATE INDEX "temporary_insureds_name_idx" ON "temporary_insureds"("name");

-- CreateIndex
CREATE INDEX "temporary_insureds_phone_idx" ON "temporary_insureds"("phone");

-- CreateIndex
CREATE INDEX "temporary_insureds_cpf_idx" ON "temporary_insureds"("cpf");

-- CreateIndex
CREATE INDEX "temporary_insureds_cnpj_idx" ON "temporary_insureds"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_insureds_broker_id_cpf_key" ON "temporary_insureds"("broker_id", "cpf");

-- CreateIndex
CREATE INDEX "insureds_name_idx" ON "insureds"("name");

-- CreateIndex
CREATE INDEX "insureds_phone_idx" ON "insureds"("phone");

-- CreateIndex
CREATE INDEX "insureds_cpf_idx" ON "insureds"("cpf");

-- CreateIndex
CREATE INDEX "insureds_cnpj_idx" ON "insureds"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "insureds_broker_id_cpf_key" ON "insureds"("broker_id", "cpf");

-- CreateIndex
CREATE UNIQUE INDEX "insureds_broker_id_cnpj_key" ON "insureds"("broker_id", "cnpj");

-- CreateIndex
CREATE INDEX "quotes_requested_at_idx" ON "quotes"("requested_at");

-- CreateIndex
CREATE INDEX "quotes_producer_id_idx" ON "quotes"("producer_id");

-- CreateIndex
CREATE INDEX "quotes_insurance_company_id_idx" ON "quotes"("insurance_company_id");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_modality_idx" ON "quotes"("modality");

-- CreateIndex
CREATE INDEX "quotes_id_requested_at_idx" ON "quotes"("id", "requested_at");

-- CreateIndex
CREATE UNIQUE INDEX "safes_previous_safe_id_key" ON "safes"("previous_safe_id");

-- CreateIndex
CREATE UNIQUE INDEX "quote_vehicles_vehicle_without_plate_id_key" ON "quote_vehicles"("vehicle_without_plate_id");

-- CreateIndex
CREATE UNIQUE INDEX "quote_vehicles_quote_id_key" ON "quote_vehicles"("quote_id");

-- CreateIndex
CREATE UNIQUE INDEX "safe_vehicles_vehicle_without_plate_id_key" ON "safe_vehicles"("vehicle_without_plate_id");

-- CreateIndex
CREATE UNIQUE INDEX "safe_vehicles_safe_id_key" ON "safe_vehicles"("safe_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_key" ON "vehicles"("plate");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_alternative_key" ON "vehicles"("plate_alternative");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_plate_plate_alternative_key" ON "vehicles"("plate", "plate_alternative");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_cnpj_key" ON "insurance_companies"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_categories_contacts_insurance_company_i_key" ON "insurance_companies_categories_contacts"("insurance_company_id", "index");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_contacts_category_id_value_key" ON "insurance_companies_contacts"("category_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_contacts_category_id_index_key" ON "insurance_companies_contacts"("category_id", "index");

-- CreateIndex
CREATE UNIQUE INDEX "brokers_cnpj_key" ON "brokers"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "brokers_slug_key" ON "brokers"("slug");

-- CreateIndex
CREATE INDEX "members_referral_idx" ON "members"("referral");

-- CreateIndex
CREATE INDEX "members_broker_id_idx" ON "members"("broker_id");

-- CreateIndex
CREATE INDEX "members_user_id_idx" ON "members"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "members_referral_key" ON "members"("referral");

-- CreateIndex
CREATE UNIQUE INDEX "members_broker_id_user_id_key" ON "members"("broker_id", "user_id");

-- CreateIndex
CREATE INDEX "invitation_broker_id_idx" ON "invitation"("broker_id");

-- CreateIndex
CREATE INDEX "invitation_email_idx" ON "invitation"("email");

-- CreateIndex
CREATE UNIQUE INDEX "invitation_broker_id_email_key" ON "invitation"("broker_id", "email");

-- CreateIndex
CREATE UNIQUE INDEX "payment_payers_id_key" ON "payment_payers"("id");

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "active_broker" FOREIGN KEY ("active_broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_impersonated_by_fkey" FOREIGN KEY ("impersonated_by") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_insureds" ADD CONSTRAINT "temporary_insureds_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insureds" ADD CONSTRAINT "insureds_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "temporary_insured" FOREIGN KEY ("temporary_insured_id") REFERENCES "temporary_insureds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_insured_id_fkey" FOREIGN KEY ("insured_id") REFERENCES "insureds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safes" ADD CONSTRAINT "safes_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safes" ADD CONSTRAINT "temporary_insured" FOREIGN KEY ("temporary_insured_id") REFERENCES "temporary_insureds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safes" ADD CONSTRAINT "safes_insured_id_fkey" FOREIGN KEY ("insured_id") REFERENCES "insureds"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safes" ADD CONSTRAINT "previous_safe" FOREIGN KEY ("previous_safe_id") REFERENCES "safes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safes" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "safes" ADD CONSTRAINT "safes_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "quote_vehicles" ADD CONSTRAINT "quote_vehicles_quote_id_fkey" FOREIGN KEY ("quote_id") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicles_without_plate" ADD CONSTRAINT "vehicles_without_plate_manufacturer_id_fkey" FOREIGN KEY ("manufacturer_id") REFERENCES "manufacturer_vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_companies_categories_contacts" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_companies_contacts" ADD CONSTRAINT "insurance_companies_contacts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "insurance_companies_categories_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "members" ADD CONSTRAINT "members_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_payers" ADD CONSTRAINT "payment_payers_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_payers" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_payers" ADD CONSTRAINT "payment_payers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "payment_payers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "payment_payers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "related_payment" FOREIGN KEY ("related_payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
