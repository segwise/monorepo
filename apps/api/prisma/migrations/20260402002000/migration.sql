-- CreateEnum
CREATE TYPE "TypeOfCommission" AS ENUM ('by_the_brokerage_commission', 'by_the_net_premium', 'fixed_value');

-- CreateEnum
CREATE TYPE "TypeOfInterest" AS ENUM ('simple', 'compound');

-- AlterTable
ALTER TABLE "safes" ADD COLUMN     "commission_discount_fixed" DECIMAL(10,2),
ADD COLUMN     "commission_discount_percentage" INTEGER,
ADD COLUMN     "commission_installments" INTEGER,
ADD COLUMN     "commission_monthly_interest" INTEGER,
ADD COLUMN     "commission_of_type" "TypeOfCommission",
ADD COLUMN     "commission_pay_interest_starting" INTEGER,
ADD COLUMN     "commission_payment_date" TIMESTAMPTZ,
ADD COLUMN     "commission_percentage" INTEGER,
ADD COLUMN     "commission_type_of_interest" "TypeOfInterest";
