import { Router } from "express";
import multer from "multer";
import sharp from "sharp";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { prisma } from "../lib/prisma.js";

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

  res.status(201).json({
    receiptImageUrl: updated.receiptImageUrl,
    originalSize: req.file.size,
    compressedSize: compressed.size,
  });
});
