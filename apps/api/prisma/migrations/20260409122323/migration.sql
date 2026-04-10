/*
  Warnings:

  - You are about to drop the column `profession` on the `insureds` table. All the data in the column will be lost.
  - You are about to drop the column `profession` on the `temporary_insureds` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "TypeProducer" AS ENUM ('condominium_administrator', 'accounting');

-- AlterTable
ALTER TABLE "insureds" DROP COLUMN "profession";

-- AlterTable
ALTER TABLE "temporary_insureds" DROP COLUMN "profession";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "type_producer" "TypeProducer";
