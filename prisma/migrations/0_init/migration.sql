-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Category" AS ENUM ('ENSINO', 'PESQUISA', 'EXTENSAO');

-- CreateEnum
CREATE TYPE "Unity" AS ENUM ('SEMESTRE', 'HORAS', 'UNIDADE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'VERIFIED');

-- CreateEnum
CREATE TYPE "ActivityClass" AS ENUM ('COMPLEMENTAR', 'LIVRE');

-- CreateEnum
CREATE TYPE "UserSituation" AS ENUM ('REGULAR', 'FORMANDO', 'FORMADO');

-- CreateEnum
CREATE TYPE "Course" AS ENUM ('CIENCIA_DA_COMPUTACAO', 'ENGENHARIA_DA_COMPUTACAO');

-- CreateTable
CREATE TABLE "roles" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(50) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "authorid" UUID,
    "unity" "Unity",
    "status" "Status" DEFAULT 'PENDING',
    "category" "Category",
    "class" "ActivityClass",
    "activitytypeid" UUID,
    "event" VARCHAR(255),
    "organization" VARCHAR(255),
    "hours" DECIMAL(10,2),
    "startdate" DATE,
    "enddate" DATE,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_types" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cod" VARCHAR(10) NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "category" "Category",
    "unity" "Unity",
    "max_hours_complementar" INTEGER,
    "max_hours_per_certificate" INTEGER,

    CONSTRAINT "activity_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "firstname" VARCHAR(255) NOT NULL,
    "lastname" VARCHAR(255) NOT NULL,
    "picture" VARCHAR(500),
    "roleid" UUID NOT NULL,
    "createdat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(6) DEFAULT CURRENT_TIMESTAMP,
    "email" VARCHAR(255) NOT NULL,
    "matricula" VARCHAR(20),
    "situation" "UserSituation",
    "course" "Course",

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "activity_types_cod_key" ON "activity_types"("cod");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_authorid_fkey" FOREIGN KEY ("authorid") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_activitytypeid_fkey" FOREIGN KEY ("activitytypeid") REFERENCES "activity_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_roleid_fkey" FOREIGN KEY ("roleid") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed default roles
INSERT INTO "roles" ("name") VALUES ('owner'), ('admin'), ('reviewer'), ('member');

