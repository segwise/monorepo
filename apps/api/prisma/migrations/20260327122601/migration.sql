-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "producer_id" UUID;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
