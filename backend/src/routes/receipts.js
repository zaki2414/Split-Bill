import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { calculateSettlements } from "../lib/settlement.js";
import { formatSettlementReport } from "../lib/report.js";

export const receiptsRouter = Router();

// GET /api/receipts - list receipts owned by the signed-in user
receiptsRouter.get("/", async (req, res) => {
  const receipts = await prisma.receipt.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
  });
  res.json(receipts);
});

// POST /api/receipts - start a split: title, payer, people (manual entry, no OCR yet).
// totalAmount/taxAmount aren't known yet at this point - items haven't been entered,
// so they default to 0 and get confirmed later, at the Summary step, once the item
// prices (and thus a live subtotal to check the printed total against) actually exist.
receiptsRouter.post("/", async (req, res) => {
  const { title, payerName, uploadedBy, merchantName, receiptDate, totalAmount, taxAmount, notes, people } =
    req.body;

  if (!payerName) {
    return res.status(400).json({ error: "payerName is required" });
  }

  const receipt = await prisma.receipt.create({
    data: {
      userId: req.userId,
      title,
      payerName,
      uploadedBy,
      merchantName,
      receiptDate: receiptDate ? new Date(receiptDate) : undefined,
      totalAmount: totalAmount ?? 0,
      taxAmount: taxAmount ?? 0,
      notes,
      people: {
        create: (people || []).map((personName) => ({ personName })),
      },
    },
    include: { people: true },
  });

  res.status(201).json(receipt);
});

// PUT /api/receipts/:id - update basic fields; used both for OCR auto-fill (taxAmount) and
// for the user editing a split that's already in progress (title/payer/total/people) without
// having to start over.
receiptsRouter.put("/:id", async (req, res) => {
  const owned = await prisma.receipt.findFirst({ where: { id: req.params.id, userId: req.userId } });
  if (!owned) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  const { title, payerName, merchantName, totalAmount, taxAmount, notes, people } = req.body;

  const ops = [
    prisma.receipt.update({
      where: { id: req.params.id },
      data: { title, payerName, merchantName, totalAmount, taxAmount, notes },
    }),
  ];

  if (Array.isArray(people)) {
    ops.push(prisma.receiptPerson.deleteMany({ where: { receiptId: req.params.id } }));
    ops.push(
      prisma.receiptPerson.createMany({
        data: people.map((personName) => ({ receiptId: req.params.id, personName })),
      })
    );
  }

  await prisma.$transaction(ops);

  const receipt = await prisma.receipt.findUnique({
    where: { id: req.params.id },
    include: { people: true },
  });

  res.json(receipt);
});

// GET /api/receipts/:id - receipt with people + items + allocations
receiptsRouter.get("/:id", async (req, res) => {
  const receipt = await prisma.receipt.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { people: true, items: true, allocations: true, settlements: true },
  });

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  res.json(receipt);
});

// GET /api/receipts/:id/allocation-form - items + people for the item-first allocation UI.
// Includes already-saved allocations (if any) so the form can be re-populated when the
// user navigates back to this step instead of starting the allocation over.
receiptsRouter.get("/:id/allocation-form", async (req, res) => {
  const receipt = await prisma.receipt.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { items: { orderBy: { orderIndex: "asc" } }, people: true, allocations: true },
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
      quantity: item.quantity,
      type: item.itemType,
      category: item.category,
      order: item.orderIndex,
    })),
    people: receipt.people.map((p) => p.personName),
    existing_allocations: receipt.allocations.map((a) => ({
      item_id: a.itemId,
      person_name: a.personName,
      quantity: a.quantityAllocated ? Number(a.quantityAllocated) : 1,
    })),
  });
});

// POST /api/receipts/:id/settlements/calculate - run the settlement algorithm and store results
receiptsRouter.post("/:id/settlements/calculate", async (req, res) => {
  const receipt = await prisma.receipt.findFirst({
    where: { id: req.params.id, userId: req.userId },
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
    taxAmount: receipt.taxAmount,
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
    prisma.receipt.update({ where: { id: receipt.id }, data: { status: "finalized" } }),
  ]);

  const stored = await prisma.settlement.findMany({ where: { receiptId: receipt.id } });

  res.json({ settlements: stored, warnings });
});

// GET /api/receipts/:id/report - human-readable "who pays whom" summary
// Reads already-calculated settlements; call settlements/calculate first.
receiptsRouter.get("/:id/report", async (req, res) => {
  const receipt = await prisma.receipt.findFirst({
    where: { id: req.params.id, userId: req.userId },
    include: { settlements: { orderBy: { createdAt: "asc" } } },
  });

  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  const { text, lines } = formatSettlementReport(receipt, receipt.settlements);

  res.json({ text, lines });
});
