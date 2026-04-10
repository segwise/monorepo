/*
  Warnings:

  - You are about to alter the column `index` on the `insurance_companies_categories_contacts` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `index` on the `insurance_companies_contacts` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `age` on the `insureds` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `qualification_time` on the `insureds` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `installment` on the `payments` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `driver_age` on the `quote_vehicles` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `driver_age` on the `safe_vehicles` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `installments` on the `safes` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `commission_percentage` on the `safes` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `commission_discount_percentage` on the `safes` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `commission_installments` on the `safes` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `commission_monthly_interest` on the `safes` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `commission_pay_interest_starting` on the `safes` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `age` on the `temporary_insureds` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `qualification_time` on the `temporary_insureds` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to drop the column `type_producer` on the `users` table. All the data in the column will be lost.
  - You are about to alter the column `model_year` on the `vehicles` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.
  - You are about to alter the column `model_year` on the `vehicles_without_plate` table. The data in that column could be lost. The data in that column will be cast from `Integer` to `SmallInt`.

*/
-- CreateEnum
CREATE TYPE "TypeOfProduction" AS ENUM ('condominium_administrator', 'accounting');

-- CreateEnum
CREATE TYPE "TypeOfProductionPayment" AS ENUM ('weekly', 'bi_weekly', 'monthly');

-- AlterTable
ALTER TABLE "insurance_companies_categories_contacts" ALTER COLUMN "index" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "insurance_companies_contacts" ALTER COLUMN "index" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "insureds" ALTER COLUMN "age" SET DATA TYPE SMALLINT,
ALTER COLUMN "qualification_time" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "members" ADD COLUMN     "percentageOfProduction" SMALLINT,
ADD COLUMN     "startOfProductionPayment" SMALLINT,
ADD COLUMN     "typeOfProductionPayment" "TypeOfProductionPayment",
ADD COLUMN     "type_of_production" "TypeOfProduction";

-- AlterTable
ALTER TABLE "payments" ALTER COLUMN "installment" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "quote_vehicles" ALTER COLUMN "driver_age" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "safe_vehicles" ALTER COLUMN "driver_age" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "safes" ALTER COLUMN "installments" SET DATA TYPE SMALLINT,
ALTER COLUMN "commission_percentage" SET DATA TYPE SMALLINT,
ALTER COLUMN "commission_discount_percentage" SET DATA TYPE SMALLINT,
ALTER COLUMN "commission_installments" SET DATA TYPE SMALLINT,
ALTER COLUMN "commission_monthly_interest" SET DATA TYPE SMALLINT,
ALTER COLUMN "commission_pay_interest_starting" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "temporary_insureds" ALTER COLUMN "age" SET DATA TYPE SMALLINT,
ALTER COLUMN "qualification_time" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "type_producer";

-- AlterTable
ALTER TABLE "vehicles" ALTER COLUMN "model_year" SET DATA TYPE SMALLINT;

-- AlterTable
ALTER TABLE "vehicles_without_plate" ALTER COLUMN "model_year" SET DATA TYPE SMALLINT;

-- DropEnum
DROP TYPE "TypeProducer";
