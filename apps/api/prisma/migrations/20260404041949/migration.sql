/*
  Warnings:

  - Made the column `icon` on table `insurance_companies` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "insurance_companies" ALTER COLUMN "icon" SET NOT NULL;
