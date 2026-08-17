import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";
import { detectReceiptText, isOcrConfigured } from "../lib/tesseractOcr.js";
import { parseReceiptText } from "../lib/receiptParser.js";

export const receiptImageRouter = Router({ mergeParams: true });

const UPLOAD_DIR = path.join(import.meta.dirname, "..", "..", "uploads");
const MAX_WIDTH = 1200;
const JPEG_QUALITY = 70;
const MAX_IMAGES = 5; // e.g. a long receipt split across a couple of photos

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20MB per file, before compression
});

const handleUpload = (req, res, next) => {
  upload.array("images", MAX_IMAGES)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return res.status(400).json({ error: `Upload failed: ${err.message}` });
    }
    if (err) return next(err);
    next();
  });
};

// POST /api/receipts/:receiptId/image - upload + compress one or more receipt photos.
// OCR text from all photos is concatenated before parsing, so items split across
// multiple shots of the same receipt are extracted together.
receiptImageRouter.post("/", handleUpload, async (req, res) => {
  const files = req.files || [];
  if (files.length === 0) {
    return res.status(400).json({ error: "at least one image file is required (field name: images)" });
  }

  const receipt = await prisma.receipt.findFirst({ where: { id: req.params.receiptId, userId: req.userId } });
  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  const savedImages = [];
  let originalSize = 0;
  let compressedSize = 0;

  for (const file of files) {
    const filename = `${req.params.receiptId}-${randomUUID()}.jpg`;

    const compressed = await sharp(file.buffer)
      .rotate() // respect EXIF orientation before stripping metadata
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY })
      .toFile(path.join(UPLOAD_DIR, filename));

    savedImages.push(`/uploads/${filename}`);
    originalSize += file.size;
    compressedSize += compressed.size;
  }

  await prisma.$transaction([
    prisma.receiptImage.createMany({
      data: savedImages.map((url) => ({ receiptId: req.params.receiptId, url })),
    }),
    prisma.receipt.update({
      where: { id: req.params.receiptId },
      data: { receiptImageUrl: savedImages[0] },
    }),
  ]);

  // OCR runs locally via Tesseract.js on the original (pre-compression) buffers for best
  // text quality. Text from every photo is concatenated before parsing, so a receipt split
  // across multiple shots still produces one merged item list.
  // Falls back to manual entry (empty extracted_items) if it errors, per spec:
  // "Fallback: Manual entry if OCR fails".
  let extractedItems = [];
  let extractedTaxAmount = 0;
  let ocrError = null;
  if (isOcrConfigured()) {
    try {
      const texts = await Promise.all(files.map((file) => detectReceiptText(file.buffer)));
      const combinedText = texts.filter(Boolean).join("\n");
      const parsed = parseReceiptText(combinedText);
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
    receiptImageUrls: savedImages,
    imageCount: savedImages.length,
    originalSize,
    compressedSize,
    ocr_configured: isOcrConfigured(),
    ocr_error: ocrError,
    extracted_items: extractedItems,
    extracted_tax_amount: extractedTaxAmount,
  });
});
