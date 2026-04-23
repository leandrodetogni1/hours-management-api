/*
  Warnings:

  - Made the column `matricula` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `situation` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "users" ALTER COLUMN "matricula" SET NOT NULL,
ALTER COLUMN "situation" SET NOT NULL,
ALTER COLUMN "situation" SET DEFAULT 'REGULAR';
