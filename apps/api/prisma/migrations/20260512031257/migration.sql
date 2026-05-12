/*
  Warnings:

  - The primary key for the `marketplace_vehicles` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `marketplace_vehicles` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `marketplace_vehicles` table. All the data in the column will be lost.
  - Added the required column `updated_at` to the `marketplace_vehicles` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `id` on the `marketplace_vehicles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `year` on the `marketplace_vehicles` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "marketplace_vehicles" DROP CONSTRAINT "marketplace_vehicles_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "updatedAt",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "id",
ADD COLUMN     "id" UUID NOT NULL,
DROP COLUMN "year",
ADD COLUMN     "year" SMALLINT NOT NULL,
ADD CONSTRAINT "marketplace_vehicles_pkey" PRIMARY KEY ("id");
