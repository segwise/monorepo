/*
  Warnings:

  - Added the required column `age` to the `insureds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `birth` to the `insureds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `cpf` to the `insureds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `marital_status` to the `insureds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `insureds` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone` to the `insureds` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "insureds" ADD COLUMN     "age" INTEGER NOT NULL,
ADD COLUMN     "birth" DATE NOT NULL,
ADD COLUMN     "cpf" VARCHAR(11) NOT NULL,
ADD COLUMN     "marital_status" "MaritalStatus" NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "phone" VARCHAR(13) NOT NULL,
ADD COLUMN     "profession" TEXT,
ADD COLUMN     "qualification_time" INTEGER;
