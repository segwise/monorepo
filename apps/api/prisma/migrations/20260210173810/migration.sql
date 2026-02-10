/*
  Warnings:

  - You are about to drop the `insureds` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "quotes" DROP CONSTRAINT "quotes_insured_id_fkey";

-- DropForeignKey
ALTER TABLE "temporary_vehicles" DROP CONSTRAINT "temporary_vehicles_insured_id_fkey";

-- DropTable
DROP TABLE "insureds";

-- CreateTable
CREATE TABLE "temporary_insureds" (
    "id" UUID NOT NULL,
    "cpf" VARCHAR(11) NOT NULL,
    "name" TEXT NOT NULL,
    "birth" DATE NOT NULL,
    "age" INTEGER NOT NULL,
    "phone" VARCHAR(13) NOT NULL,
    "marital_status" "MaritalStatus" NOT NULL,
    "qualification_time" INTEGER NOT NULL,
    "profession" TEXT,

    CONSTRAINT "temporary_insureds_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "temporary_insureds_id_key" ON "temporary_insureds"("id");

-- CreateIndex
CREATE UNIQUE INDEX "temporary_insureds_cpf_key" ON "temporary_insureds"("cpf");

-- AddForeignKey
ALTER TABLE "quotes" ADD CONSTRAINT "quotes_insured_id_fkey" FOREIGN KEY ("insured_id") REFERENCES "temporary_insureds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "temporary_vehicles" ADD CONSTRAINT "temporary_vehicles_insured_id_fkey" FOREIGN KEY ("insured_id") REFERENCES "temporary_insureds"("id") ON DELETE CASCADE ON UPDATE CASCADE;
