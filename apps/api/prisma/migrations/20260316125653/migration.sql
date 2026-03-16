/*
  Warnings:

  - Added the required column `cnpj` to the `insurance_companies` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "insurance_companies" ADD COLUMN     "cnpj" VARCHAR(14) NOT NULL;
