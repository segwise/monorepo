/*
  Warnings:

  - You are about to drop the column `userId` on the `invitation` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `invitation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `invitation` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StatusPayment" AS ENUM ('waiting', 'paid');

-- DropForeignKey
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_userId_fkey";

-- AlterTable
ALTER TABLE "invitation" DROP COLUMN "userId",
ADD COLUMN     "updated_at" TIMESTAMPTZ NOT NULL,
ADD COLUMN     "user_id" UUID NOT NULL;

-- CreateTable
CREATE TABLE "payment_payers" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_payers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_receivers" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_receivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_bridges" (
    "id" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payment_bridges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" UUID NOT NULL,
    "receiver_id" UUID,
    "payer_id" UUID,
    "bridge_id" UUID,
    "amount" DECIMAL(10,2) NOT NULL,
    "amountPaid" DECIMAL(10,2),
    "installment" INTEGER,
    "related_payment_id" UUID,
    "status" "StatusPayment" NOT NULL,
    "expiration" TIMESTAMPTZ NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "payment_receivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_payer_id_fkey" FOREIGN KEY ("payer_id") REFERENCES "payment_payers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_bridge_id_fkey" FOREIGN KEY ("bridge_id") REFERENCES "payment_bridges"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_related_payment_id_fkey" FOREIGN KEY ("related_payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;
