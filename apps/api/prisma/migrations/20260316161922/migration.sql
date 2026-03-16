-- CreateEnum
CREATE TYPE "InsuranceCompanyContactCoverage" AS ENUM ('all_regions', 'capitals_and_metropolitan_regions');

-- CreateTable
CREATE TABLE "insurance_companies_contacts" (
    "id" UUID NOT NULL,
    "index" INTEGER NOT NULL,
    "label" TEXT NOT NULL,
    "coverage" "InsuranceCompanyContactCoverage" NOT NULL,
    "value" VARCHAR(13) NOT NULL,
    "is_whatsapp" BOOLEAN,
    "insurance_company_id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insurance_companies_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_contacts_insurance_company_id_value_key" ON "insurance_companies_contacts"("insurance_company_id", "value");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_contacts_index_key" ON "insurance_companies_contacts"("index");

-- AddForeignKey
ALTER TABLE "insurance_companies_contacts" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
