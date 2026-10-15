-- CreateTable
CREATE TABLE "quotes_financing_a_vehicles" (
    "id" UUID NOT NULL,
    "referral" TEXT,
    "model" TEXT NOT NULL,
    "model_year" SMALLINT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "downPayment" DECIMAL(10,2),
    "name" TEXT NOT NULL,
    "phone" VARCHAR(13) NOT NULL,

    CONSTRAINT "quotes_financing_a_vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quotes_financing_a_vehicles_referral_idx" ON "quotes_financing_a_vehicles"("referral");

-- CreateIndex
CREATE INDEX "quotes_financing_a_vehicles_name_idx" ON "quotes_financing_a_vehicles"("name");

-- CreateIndex
CREATE INDEX "quotes_financing_a_vehicles_phone_idx" ON "quotes_financing_a_vehicles"("phone");
