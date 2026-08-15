-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "title" VARCHAR(150);

-- CreateTable
CREATE TABLE "receipt_people" (
    "id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "person_name" VARCHAR(100) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_people_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "receipt_people" ADD CONSTRAINT "receipt_people_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
