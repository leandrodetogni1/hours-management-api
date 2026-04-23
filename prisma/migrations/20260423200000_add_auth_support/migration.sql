-- Add picture column for Google OAuth avatar
ALTER TABLE "users" ADD COLUMN "picture" VARCHAR(500);

-- Make matricula and situation nullable (Google OAuth users fill these later)
ALTER TABLE "users" ALTER COLUMN "matricula" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "situation" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "situation" DROP DEFAULT;

-- Seed new roles used by Google-OAuth auth flow (idempotent)
INSERT INTO "roles" ("name") VALUES
  ('admin'),
  ('coordinator'),
  ('student'),
  ('coach')
ON CONFLICT ("name") DO NOTHING;
