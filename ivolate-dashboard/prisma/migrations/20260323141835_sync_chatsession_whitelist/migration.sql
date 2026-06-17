/*
  Warnings:

  - You are about to drop the `Whitelist` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "ChatSession" ADD COLUMN     "isWhitelisted" BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE "Whitelist";
