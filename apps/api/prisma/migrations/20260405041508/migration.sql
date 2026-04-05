/*
  Warnings:

  - You are about to drop the column `amountPaid` on the `payments` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "payments" DROP COLUMN "amountPaid",
ADD COLUMN     "amount_paid" DECIMAL(10,2);

-- RenameForeignKey
ALTER TABLE "payments" RENAME CONSTRAINT "payments_related_payment_id_fkey" TO "related_payment";
