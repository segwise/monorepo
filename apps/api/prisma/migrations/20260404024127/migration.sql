/*
  Warnings:

  - Added the required column `broker_id` to the `safes` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "safes" ADD COLUMN     "broker_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "safes" ADD CONSTRAINT "safes_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
