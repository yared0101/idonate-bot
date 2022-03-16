/*
  Warnings:

  - You are about to drop the column `amount` on the `any` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "any" DROP COLUMN "amount";

-- AlterTable
ALTER TABLE "confirmed" ADD COLUMN     "anyAmount" DOUBLE PRECISION;
