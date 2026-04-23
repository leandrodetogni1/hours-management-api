-- CreateEnum
CREATE TYPE "UserSituation" AS ENUM ('REGULAR', 'FORMANDO', 'FORMADO');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "matricula" VARCHAR(20),
ADD COLUMN     "situation" "UserSituation";
