-- AlterTable
ALTER TABLE "users" ADD COLUMN "google_id" VARCHAR(100);

-- AlterTable
ALTER TABLE "receipts" ADD COLUMN "user_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- AddForeignKey
ALTER TABLE "receipts" ADD CONSTRAINT "receipts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
