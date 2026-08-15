import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { calculateSettlements } from "../lib/settlement.js";
import { formatSettlementReport } from "../lib/report.js";

export const receiptsRouter = Router();

// GET /api/receipts - list receipts
receiptsRouter.get("/", async (req, res) => {
  const receipts = await prisma.receipt.findMany({
    orderBy: { createdAt: "desc" },
  });
  res.json(receipts);
});

// POST /api/receipts - start a split: title, payer, people, receipt basics (manual entry, no OCR yet)
receiptsRouter.post("/", async (req, res) => {
  const { title, payerName, uploadedBy, merchantName, receiptDate, totalAmount, notes, people } = req.body;

  if (!payerName) {
    return res.status(400).json({ error: "payerName is required" });
  }
  if (totalAmount === undefined) {
    return res.status(400).json({ error: "totalAmount is required" });
  }

  const receipt = await prisma.receipt.create({
    data: {
      title,
      payerName,
      uploadedBy,
      merchantName,
      receiptDate: receiptDate ? new Date(receiptDate) : undefined,
      totalAmount,
      notes,
      people: {
        create: (people || []).map((personName) => ({ personName })),
      },
    },
    include: { people: true },
  });

  res.status(201).json(receipt);
});

// GET /api/receipts/:id - receipt with people + items + allocations
receiptsRouter.get("/:id", async (req, res) => {
  const receipt = await prisma.receipt.findUnique({
    where: { id: req.params.id },
    include: { people: true, items: true, allocations: true, settlements: true },
  });

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  res.json(receipt);
});

// GET /api/receipts/:id/allocation-form - items + people for the item-first allocation UI
receiptsRouter.get("/:id/allocation-form", async (req, res) => {
  const receipt = await prisma.receipt.findUnique({
    where: { id: req.params.id },
    include: { items: { orderBy: { orderIndex: "asc" } }, people: true },
  });

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  res.json({
    receipt_id: receipt.id,
    title: receipt.title,
    items: receipt.items.map((item) => ({
      id: item.id,
      name: item.name,
      price: item.totalPrice,
      type: item.itemType,
      order: item.orderIndex,
    })),
    people: receipt.people.map((p) => p.personName),
  });
});

// POST /api/receipts/:id/settlements/calculate - run the settlement algorithm and store results
receiptsRouter.post("/:id/settlements/calculate", async (req, res) => {
  const receipt = await prisma.receipt.findUnique({
    where: { id: req.params.id },
    include: { items: true, allocations: true },
  });

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  const { settlements, warnings } = calculateSettlements({
    items: receipt.items,
    allocations: receipt.allocations,
    payerName: receipt.payerName,
    totalAmount: receipt.totalAmount,
  });

  await prisma.$transaction([
    prisma.settlement.deleteMany({ where: { receiptId: receipt.id } }),
    prisma.settlement.createMany({
      data: settlements.map((s) => ({
        receiptId: receipt.id,
        payerName: s.payerName,
        owerName: s.owerName,
        amount: s.amount,
      })),
    }),
  ]);

  const stored = await prisma.settlement.findMany({ where: { receiptId: receipt.id } });

  res.json({ settlements: stored, warnings });
});

// GET /api/receipts/:id/report - human-readable "who pays whom" summary
// Reads already-calculated settlements; call settlements/calculate first.
receiptsRouter.get("/:id/report", async (req, res) => {
  const receipt = await prisma.receipt.findUnique({
    where: { id: req.params.id },
    include: { settlements: { orderBy: { createdAt: "asc" } } },
  });

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  const { text, lines } = formatSettlementReport(receipt, receipt.settlements);

  res.json({ text, lines });
});
