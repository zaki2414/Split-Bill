import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { detectReceiptText, isOcrConfigured } from "../lib/googleVision.js";
import { parseReceiptText } from "../lib/receiptParser.js";

export const receiptImageRouter = Router({ mergeParams: true });

const UPLOAD_DIR = path.join(import.meta.dirname, "..", "..", "uploads");
const MAX_WIDTH = 1200;
const JPEG_QUALITY = 70;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB raw upload cap, before compression
});

const handleUpload = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload failed: ${err.message}` });
    }
    if (err) return next(err);
    next();
  });
};

// POST /api/receipts/:receiptId/image - upload + compress the receipt photo
receiptImageRouter.post("/", handleUpload, async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "image file is required (field name: image)" });
  }

  const receipt = await prisma.receipt.findUnique({ where: { id: req.params.receiptId } });
  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  const filename = `${req.params.receiptId}-${randomUUID()}.jpg`;

  const compressed = await sharp(req.file.buffer)
    .rotate() // respect EXIF orientation before stripping metadata
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .jpeg({ quality: JPEG_QUALITY })
    .toFile(path.join(UPLOAD_DIR, filename));

  const updated = await prisma.receipt.update({
    where: { id: req.params.receiptId },
    data: { receiptImageUrl: `/uploads/${filename}` },
  });

  // OCR runs on the original (pre-compression) buffer for best text quality.
  // Falls back to manual entry (empty extracted_items) if not configured or if it errors,
  // per spec: "Fallback: Manual entry if OCR fails".
  let extractedItems = [];
  let extractedTaxAmount = 0;
  let ocrError = null;
  if (isOcrConfigured()) {
    try {
      const text = await detectReceiptText(req.file.buffer);
      const parsed = parseReceiptText(text);
      extractedItems = parsed.items;
      extractedTaxAmount = parsed.taxAmount;
      if (extractedTaxAmount > 0) {
        await prisma.receipt.update({
          where: { id: req.params.receiptId },
          data: { taxAmount: extractedTaxAmount },
        });
      }
    } catch (err) {
      ocrError = err.message;
    }
  }

  res.status(201).json({
    receiptImageUrl: updated.receiptImageUrl,
    originalSize: req.file.size,
    compressedSize: compressed.size,
    ocr_configured: isOcrConfigured(),
    ocr_error: ocrError,
    extracted_items: extractedItems,
    extracted_tax_amount: extractedTaxAmount,
  });
});
