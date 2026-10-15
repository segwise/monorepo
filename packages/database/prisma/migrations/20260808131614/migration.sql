-- DropForeignKey
ALTER TABLE "endorsements" DROP CONSTRAINT "endorsements_id_fkey";

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_safe_id_fkey" FOREIGN KEY ("safe_id") REFERENCES "safes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
