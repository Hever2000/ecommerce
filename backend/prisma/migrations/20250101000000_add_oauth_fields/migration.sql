-- AlterTable: make password optional for OAuth users
ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable: add OAuth fields
ALTER TABLE "users" ADD COLUMN "avatar" VARCHAR(500);
ALTER TABLE "users" ADD COLUMN "google_id" VARCHAR(255);

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");
