/*
  Warnings:

  - A unique constraint covering the columns `[insurance_company_id,index]` on the table `insurance_companies_categories_contacts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "insurance_companies_categories_contacts_index_key";

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_categories_contacts_insurance_company_i_key" ON "insurance_companies_categories_contacts"("insurance_company_id", "index");
