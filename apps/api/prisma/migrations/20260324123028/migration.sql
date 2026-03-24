/*
  Warnings:

  - A unique constraint covering the columns `[category_id,index]` on the table `insurance_companies_contacts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "insurance_companies_contacts_index_key";

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_contacts_category_id_index_key" ON "insurance_companies_contacts"("category_id", "index");
