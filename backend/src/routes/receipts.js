import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const receiptsRouter = Router();

// GET /api/receipts - list receipts
receiptsRouter.get("/", async (req, res) => {
  const receipts = await prisma.receipt.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(receipts);
});

// POST /api/receipts - create receipt (manual entry, no OCR yet)
receiptsRouter.post("/", async (req, res) => {
  const { payerName, uploadedBy, merchantName, receiptDate, totalAmount, notes } = req.body;

  if (!payerName) {
    return res.status(400).json({ error: "payerName is required" });
  }
  if (totalAmount === undefined) {
    return res.status(400).json({ error: "totalAmount is required" });
  }

  const receipt = await prisma.receipt.create({
    data: {
      payerName,
      uploadedBy,
      merchantName,
      receiptDate: receiptDate ? new Date(receiptDate) : undefined,
      totalAmount,
      notes,
    },
  });

  res.status(201).json(receipt);
});

// GET /api/receipts/:id - receipt with items + allocations
receiptsRouter.get("/:id", async (req, res) => {
  const receipt = await prisma.receipt.findUnique({
    where: { id: req.params.id },
    include: { items: true, allocations: true, settlements: true },
  });

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  res.json(receipt);
});
