import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { findOwnedReceipt } from "../lib/ownership.js";

export const itemsRouter = Router({ mergeParams: true });

// Transport is a flat shared cost (e.g. one ojek fare for the group), not something
// ordered per-unit-per-person, so it defaults to SHARED while food/drink/other default
// to INDIVIDUAL.
const DEFAULT_ITEM_TYPE_BY_CATEGORY = {
  food: "INDIVIDUAL",
  drink: "INDIVIDUAL",
  transport: "SHARED",
  other: "INDIVIDUAL",
};

itemsRouter.use(async (req, res, next) => {
  const receipt = await findOwnedReceipt(req.params.receiptId, req.userId);
  if (!receipt) {
    return res.status(404).json({ error: "Receipt not found" });
  }
  next();
});

// GET /api/receipts/:receiptId/items
itemsRouter.get("/", async (req, res) => {
  const items = await prisma.receiptItem.findMany({
    where: { receiptId: req.params.receiptId },
    orderBy: { orderIndex: "asc" },
  });
  res.json(items);
});

// POST /api/receipts/:receiptId/items - manual item entry (OCR comes later)
itemsRouter.post("/", async (req, res) => {
  const { name, category, totalPrice, quantity, unitPrice, itemType, orderIndex } = req.body;

  if (!name || totalPrice === undefined || quantity === undefined) {
    return res.status(400).json({ error: "name, totalPrice and quantity are required" });
  }

  const resolvedType = itemType || DEFAULT_ITEM_TYPE_BY_CATEGORY[category] || "INDIVIDUAL";

  const item = await prisma.receiptItem.create({
    data: {
      receiptId: req.params.receiptId,
      name,
      category,
      totalPrice,
      quantity,
      unitPrice: unitPrice ?? (quantity > 0 ? totalPrice / quantity : null),
      itemType: resolvedType,
      orderIndex,
    },
  });

  res.status(201).json(item);
});

// PUT /api/receipts/:receiptId/items/:itemId
itemsRouter.put("/:itemId", async (req, res) => {
  const { name, category, totalPrice, quantity, unitPrice, itemType, orderIndex } = req.body;

  // totalPrice/quantity can change independently of each other (e.g. correcting the
  // quantity after OCR misread it) - unitPrice must be re-derived from whichever values
  // end up in effect, or it goes stale and silently corrupts INDIVIDUAL item settlement math.
  const existing = await prisma.receiptItem.findUniqueOrThrow({ where: { id: req.params.itemId } });
  const effectiveTotalPrice = totalPrice ?? existing.totalPrice;
  const effectiveQuantity = quantity ?? existing.quantity;

  const item = await prisma.receiptItem.update({
    where: { id: req.params.itemId },
    data: {
      name,
      category,
      totalPrice,
      quantity,
      unitPrice: unitPrice ?? (effectiveQuantity > 0 ? Number(effectiveTotalPrice) / effectiveQuantity : null),
      itemType,
      orderIndex,
    },
  });

  res.json(item);
});

// DELETE /api/receipts/:receiptId/items/:itemId
itemsRouter.delete("/:itemId", async (req, res) => {
  await prisma.receiptItem.delete({ where: { id: req.params.itemId } });
  res.status(204).end();
});
