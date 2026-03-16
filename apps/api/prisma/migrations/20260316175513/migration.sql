/*
  Warnings:

  - You are about to drop the column `insurance_company_id` on the `insurance_companies_contacts` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[category_id,value]` on the table `insurance_companies_contacts` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `category_id` to the `insurance_companies_contacts` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "insurance_companies_contacts" DROP CONSTRAINT "insurance_company";

-- DropIndex
DROP INDEX "insurance_companies_contacts_insurance_company_id_value_key";

-- AlterTable
ALTER TABLE "insurance_companies_contacts" DROP COLUMN "insurance_company_id",
ADD COLUMN     "category_id" UUID NOT NULL;

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

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_categories_contacts_insurance_company_i_key" ON "insurance_companies_categories_contacts"("insurance_company_id");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_categories_contacts_index_key" ON "insurance_companies_categories_contacts"("index");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_contacts_category_id_value_key" ON "insurance_companies_contacts"("category_id", "value");

-- AddForeignKey
ALTER TABLE "insurance_companies_categories_contacts" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "insurance_companies_contacts" ADD CONSTRAINT "insurance_companies_contacts_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "insurance_companies_categories_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
