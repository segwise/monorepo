/*
  Warnings:

  - Added the required column `clientRegistration` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "marketplace_vehicles" ADD COLUMN     "clientRegistration" VARCHAR(11) NOT NULL;
