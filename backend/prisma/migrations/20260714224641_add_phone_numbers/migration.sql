/*
  Warnings:

  - You are about to drop the column `phone` on the `users` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "users_phone_key";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "phone";

-- CreateTable
CREATE TABLE "phone_numbers" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_numbers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "phone_numbers_number_key" ON "phone_numbers"("number");

-- CreateIndex
CREATE INDEX "phone_numbers_userId_idx" ON "phone_numbers"("userId");

-- AddForeignKey
ALTER TABLE "phone_numbers" ADD CONSTRAINT "phone_numbers_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
