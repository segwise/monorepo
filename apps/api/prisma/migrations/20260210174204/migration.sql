/*
  Warnings:

  - The values [manual_gateprivate] on the enum `Garage` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Garage_new" AS ENUM ('automatic_gate', 'manual_gate', 'private', 'no_garage');
ALTER TABLE "temporary_vehicles" ALTER COLUMN "garage_of_the_residence" TYPE "Garage_new" USING ("garage_of_the_residence"::text::"Garage_new");
ALTER TYPE "Garage" RENAME TO "Garage_old";
ALTER TYPE "Garage_new" RENAME TO "Garage";
DROP TYPE "public"."Garage_old";
COMMIT;

-- AlterTable
ALTER TABLE "temporary_vehicles" ALTER COLUMN "plate" DROP NOT NULL;
