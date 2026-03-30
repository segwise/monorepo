-- CreateIndex
CREATE INDEX "quotes_id_idx" ON "quotes"("id");

-- CreateIndex
CREATE INDEX "quotes_request_at_id_idx" ON "quotes"("request_at", "id");

-- CreateIndex
CREATE INDEX "quotes_id_request_at_idx" ON "quotes"("id", "request_at");
