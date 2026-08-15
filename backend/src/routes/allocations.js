import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const allocationsRouter = Router();

// POST /api/allocations/batch - replaces all allocations for the receipt with the given set
allocationsRouter.post("/batch", async (req, res) => {
  const { receipt_id: receiptId, allocations } = req.body;

  if (!receiptId || !Array.isArray(allocations)) {
    return res.status(400).json({ error: "receipt_id and allocations[] are required" });
  }

  const itemIds = allocations.map((a) => a.item_id);
  const items = await prisma.receiptItem.findMany({ where: { id: { in: itemIds } } });
  const itemsById = new Map(items.map((i) => [i.id, i]));

  const rows = [];
  const warnings = [];

  for (const entry of allocations) {
    const item = itemsById.get(entry.item_id);
    if (!item) {
      warnings.push(`Unknown item_id ${entry.item_id}`);
      continue;
    }

    const personNames = entry.person_names || [];
    if (personNames.length === 0) {
      warnings.push(`Item "${item.name}" has no consumers`);
    }

    for (const personName of personNames) {
      rows.push({
        receiptId,
        itemId: entry.item_id,
        personName,
        quantityAllocated: item.itemType === "INDIVIDUAL" ? 1 : null,
      });
    }
  }

  await prisma.$transaction([
    prisma.itemAllocation.deleteMany({ where: { receiptId } }),
    prisma.itemAllocation.createMany({ data: rows }),
  ]);

  res.json({ success: true, allocation_count: rows.length, validation_warnings: warnings });
});

// GET /api/allocations/:receiptId/summary
allocationsRouter.get("/:receiptId/summary", async (req, res) => {
  const allocations = await prisma.itemAllocation.findMany({
    where: { receiptId: req.params.receiptId },
    include: { item: true },
  });

  const summary = {};
  for (const alloc of allocations) {
    if (!summary[alloc.personName]) summary[alloc.personName] = [];
    summary[alloc.personName].push(alloc.item.name);
  }

  res.json({
    allocations: summary,
    status: allocations.length > 0 ? "ready_to_calculate" : "empty",
  });
});
