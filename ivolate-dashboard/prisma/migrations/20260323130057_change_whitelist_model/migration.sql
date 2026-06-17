/*
  Warnings:

  - You are about to drop the column `isWhitelisted` on the `User` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "User" DROP COLUMN "isWhitelisted";

-- CreateTable
CREATE TABLE "Whitelist" (
    "phoneNumber" TEXT NOT NULL,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Whitelist_pkey" PRIMARY KEY ("phoneNumber")
);
