-- CreateIndex
CREATE INDEX "quotes_producer_id_idx" ON "quotes"("producer_id");

-- CreateIndex
CREATE INDEX "quotes_insurance_company_id_idx" ON "quotes"("insurance_company_id");

-- CreateIndex
CREATE INDEX "quotes_status_idx" ON "quotes"("status");

-- CreateIndex
CREATE INDEX "quotes_modality_idx" ON "quotes"("modality");

-- CreateIndex
CREATE INDEX "quotes_request_at_idx" ON "quotes"("request_at");

-- CreateIndex
CREATE INDEX "users_name_idx" ON "users"("name");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_phone_idx" ON "users"("phone");
