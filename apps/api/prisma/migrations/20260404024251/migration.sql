/*
  Warnings:

  - Added the required column `broker_id` to the `quotes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "broker_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
