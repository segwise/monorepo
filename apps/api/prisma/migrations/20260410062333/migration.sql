/*
  Warnings:

  - You are about to drop the column `user_id` on the `invitation` table. All the data in the column will be lost.
  - Added the required column `inviter_id` to the `invitation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "invitation" DROP CONSTRAINT "invitation_user_id_fkey";

-- AlterTable
ALTER TABLE "invitation" DROP COLUMN "user_id",
ADD COLUMN     "inviter_id" UUID NOT NULL;

-- AddForeignKey
ALTER TABLE "invitation" ADD CONSTRAINT "invitation_inviter_id_fkey" FOREIGN KEY ("inviter_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
