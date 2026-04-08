-- DropForeignKey
ALTER TABLE "payment_payers" DROP CONSTRAINT "broker";

-- DropForeignKey
ALTER TABLE "payment_payers" DROP CONSTRAINT "insurance_company";

-- DropForeignKey
ALTER TABLE "payment_payers" DROP CONSTRAINT "user";

-- AlterTable
ALTER TABLE "payment_payers" ADD COLUMN     "broker_id" UUID,
ADD COLUMN     "insurance_company_id" UUID,
ADD COLUMN     "user_id" UUID;

-- AddForeignKey
ALTER TABLE "payment_payers" ADD CONSTRAINT "payment_payers_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_payers" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_payers" ADD CONSTRAINT "payment_payers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
