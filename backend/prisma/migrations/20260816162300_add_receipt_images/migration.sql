-- CreateTable
CREATE TABLE "receipt_images" (
    "id" UUID NOT NULL,
    "receipt_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "receipt_images_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "receipt_images" ADD CONSTRAINT "receipt_images_receipt_id_fkey" FOREIGN KEY ("receipt_id") REFERENCES "receipts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
