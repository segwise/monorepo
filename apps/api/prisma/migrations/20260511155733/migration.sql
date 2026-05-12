/*
  Warnings:

  - You are about to drop the column `model_year` on the `quotes_financing_a_vehicles` table. All the data in the column will be lost.
  - Added the required column `year` to the `quotes_financing_a_vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "quotes_financing_a_vehicles" DROP COLUMN "model_year",
ADD COLUMN     "year" SMALLINT NOT NULL;
