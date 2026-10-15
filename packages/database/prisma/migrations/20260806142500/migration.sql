-- CreateEnum
CREATE TYPE "EndorsementType" AS ENUM ('vehicle_driver', 'address', 'franchise', 'cancellation');

-- CreateTable
CREATE TABLE "endorsements" (
    "id" UUID NOT NULL,
    "type" "EndorsementType" NOT NULL,
    "safe_id" UUID NOT NULL,
    "effectived_at" DATE,
    "driver_cpf" VARCHAR(11),
    "driver_name" TEXT,
    "driver_birth" DATE,
    "driver_age" SMALLINT,
    "vehicle_id" UUID,
    "vehicle_without_plate_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endorsements_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_id_fkey" FOREIGN KEY ("id") REFERENCES "safes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "endorsements_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "endorsements" ADD CONSTRAINT "vehicle_without_plate" FOREIGN KEY ("vehicle_without_plate_id") REFERENCES "vehicles_without_plate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
