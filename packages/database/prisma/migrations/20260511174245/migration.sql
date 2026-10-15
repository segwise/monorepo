-- CreateTable
CREATE TABLE "marketplace_vehicles" (
    "id" UUID NOT NULL,
    "photo" TEXT NOT NULL,
    "gallery" TEXT[],
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "mileage" INTEGER NOT NULL,
    "color" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketplace_vehicles_year_idx" ON "marketplace_vehicles"("year");

-- CreateIndex
CREATE INDEX "marketplace_vehicles_year_price_idx" ON "marketplace_vehicles"("year", "price");
