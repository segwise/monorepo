-- CreateEnum
CREATE TYPE "MarketingTemplate" AS ENUM ('partnership_accounting', 'partnership_condominium');

-- CreateEnum
CREATE TYPE "MarketingFrequency" AS ENUM ('daily', 'monthly');

-- CreateEnum
CREATE TYPE "StatusMarketingDelivery" AS ENUM ('sent', 'delivered', 'bounced', 'complained', 'failed');

-- CreateTable
CREATE TABLE "marketing_campaigns" (
    "id" UUID NOT NULL,
    "broker_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "template" "MarketingTemplate" NOT NULL,
    "subject" TEXT NOT NULL,
    "whatsapp_phone" TEXT NOT NULL,
    "whatsapp_message" TEXT,
    "frequency" "MarketingFrequency" NOT NULL,
    "day_of_month" SMALLINT,
    "hour" SMALLINT NOT NULL DEFAULT 9,
    "active" BOOLEAN NOT NULL DEFAULT false,
    "last_run_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "marketing_campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_contacts" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "marketing_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "marketing_deliveries" (
    "id" UUID NOT NULL,
    "campaign_id" UUID NOT NULL,
    "contact_id" UUID NOT NULL,
    "resend_id" TEXT,
    "status" "StatusMarketingDelivery" NOT NULL DEFAULT 'sent',
    "error" TEXT,
    "sent_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "delivered_at" TIMESTAMPTZ,
    "opened_at" TIMESTAMPTZ,
    "clicked_at" TIMESTAMPTZ,
    "open_count" INTEGER NOT NULL DEFAULT 0,
    "click_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "marketing_deliveries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "marketing_campaigns_broker_id_idx" ON "marketing_campaigns"("broker_id");

-- CreateIndex
CREATE INDEX "marketing_contacts_campaign_id_idx" ON "marketing_contacts"("campaign_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_contacts_campaign_id_email_key" ON "marketing_contacts"("campaign_id", "email");

-- CreateIndex
CREATE INDEX "marketing_deliveries_campaign_id_idx" ON "marketing_deliveries"("campaign_id");

-- CreateIndex
CREATE INDEX "marketing_deliveries_contact_id_idx" ON "marketing_deliveries"("contact_id");

-- CreateIndex
CREATE UNIQUE INDEX "marketing_deliveries_resend_id_key" ON "marketing_deliveries"("resend_id");

-- AddForeignKey
ALTER TABLE "marketing_campaigns" ADD CONSTRAINT "marketing_campaigns_broker_id_fkey" FOREIGN KEY ("broker_id") REFERENCES "brokers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_contacts" ADD CONSTRAINT "marketing_contacts_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_deliveries" ADD CONSTRAINT "marketing_deliveries_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "marketing_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "marketing_deliveries" ADD CONSTRAINT "marketing_deliveries_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "marketing_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
