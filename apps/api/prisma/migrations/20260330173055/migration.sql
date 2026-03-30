-- CreateIndex
CREATE INDEX "temporary_insureds_name_idx" ON "temporary_insureds"("name");

-- CreateIndex
CREATE INDEX "temporary_insureds_phone_idx" ON "temporary_insureds"("phone");

-- CreateIndex
CREATE INDEX "temporary_insureds_cpf_idx" ON "temporary_insureds"("cpf");

-- CreateIndex
CREATE INDEX "users_referral_idx" ON "users"("referral");
