-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "expiration" DATE,
ADD COLUMN     "franchise" DECIMAL(10,2),
ADD COLUMN     "insurance_company_id" UUID;

-- CreateTable
CREATE TABLE "insurance_companies" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "image" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "insurance_companies_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "insurance_company" FOREIGN KEY ("insurance_company_id") REFERENCES "insurance_companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
