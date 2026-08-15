import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const itemsRouter = Router({ mergeParams: true });

const DEFAULT_ITEM_TYPE_BY_CATEGORY = {
  food: "SHARED",
  drink: "INDIVIDUAL",
  transport: "SHARED",
  other: "SHARED",
};

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

  const resolvedType = itemType || DEFAULT_ITEM_TYPE_BY_CATEGORY[category] || "SHARED";

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

  const item = await prisma.receiptItem.update({
    where: { id: req.params.itemId },
    data: { name, category, totalPrice, quantity, unitPrice, itemType, orderIndex },
  });

  res.json(item);
});

// DELETE /api/receipts/:receiptId/items/:itemId
itemsRouter.delete("/:itemId", async (req, res) => {
  await prisma.receiptItem.delete({ where: { id: req.params.itemId } });
  res.status(204).end();
});
