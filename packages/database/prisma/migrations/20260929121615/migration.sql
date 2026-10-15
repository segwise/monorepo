/*
  Warnings:

  - The `start_of_production_payment` column on the `invitation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `start_of_production_payment` column on the `members` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "StatusMember" AS ENUM ('active', 'suspended');

-- AlterTable
ALTER TABLE "invitation" DROP COLUMN "start_of_production_payment",
ADD COLUMN     "start_of_production_payment" INTEGER[];

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "status" "StatusMember" NOT NULL DEFAULT 'active',
DROP COLUMN "start_of_production_payment",
ADD COLUMN     "start_of_production_payment" INTEGER[];
