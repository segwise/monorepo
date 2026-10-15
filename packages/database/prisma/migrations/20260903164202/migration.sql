/*
  Warnings:

  - A unique constraint covering the columns `[category_id,value,is_whatsapp]` on the table `insurance_companies_contacts` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "insurance_companies_contacts_category_id_value_key";

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_contacts_category_id_value_is_whatsapp_key" ON "insurance_companies_contacts"("category_id", "value", "is_whatsapp");
