/*
  Warnings:

  - You are about to drop the column `request_at` on the `quotes` table. All the data in the column will be lost.
  - You are about to drop the column `request_at` on the `safes` table. All the data in the column will be lost.
  - Added the required column `requested_at` to the `safes` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "quotes_id_request_at_idx";

-- DropIndex
DROP INDEX "quotes_request_at_idx";

-- AlterTable
ALTER TABLE "quotes" DROP COLUMN "request_at",
ADD COLUMN     "requested_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "safes" DROP COLUMN "request_at",
ADD COLUMN     "requested_at" TIMESTAMPTZ NOT NULL;

-- CreateIndex
CREATE INDEX "quotes_requested_at_idx" ON "quotes"("requested_at");

-- CreateIndex
CREATE INDEX "quotes_id_requested_at_idx" ON "quotes"("id", "requested_at");
