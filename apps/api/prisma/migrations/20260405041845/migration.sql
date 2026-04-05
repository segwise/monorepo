/*
  Warnings:

  - Added the required column `type` to the `payments` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "TypePayment" AS ENUM ('commission', 'others');

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "type" "TypePayment" NOT NULL;
