/*
  Warnings:

  - The values [car] on the enum `ModalityInsurance` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[referral]` on the table `invitation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ModalityInsurance_new" AS ENUM ('vehicle', 'health', 'residence', 'business', 'condominium', 'travel', 'professional', 'construction');
ALTER TABLE "quotes" ALTER COLUMN "modality" TYPE "ModalityInsurance_new" USING ("modality"::text::"ModalityInsurance_new");
ALTER TABLE "safes" ALTER COLUMN "modality" TYPE "ModalityInsurance_new" USING ("modality"::text::"ModalityInsurance_new");
ALTER TYPE "ModalityInsurance" RENAME TO "ModalityInsurance_old";
ALTER TYPE "ModalityInsurance_new" RENAME TO "ModalityInsurance";
DROP TYPE "public"."ModalityInsurance_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "invitation_referral_key" ON "invitation"("referral");
