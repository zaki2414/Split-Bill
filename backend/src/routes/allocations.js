import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { findOwnedReceipt } from "../lib/ownership.js";

export const allocationsRouter = Router();

// POST /api/allocations/batch - replaces all allocations for the receipt with the given set
// Body shape per item: { item_id, people: [{ person_name, quantity }] }.
// quantity only matters for INDIVIDUAL items (e.g. 2 servings of rice split unevenly);
// for SHARED items any quantity is accepted but ignored by the settlement calculation.
allocationsRouter.post("/batch", async (req, res) => {
  const { receipt_id: receiptId, allocations } = req.body;

  if (!receiptId || !Array.isArray(allocations)) {
    return res.status(400).json({ error: "receipt_id and allocations[] are required" });
  }

  const owned = await findOwnedReceipt(receiptId, req.userId);
  if (!owned) {
    return res.status(404).json({ error: "Receipt not found" });
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

    const peopleEntries = entry.people || [];
    if (peopleEntries.length === 0) {
      warnings.push(`Item "${item.name}" has no consumers`);
    }

    const totalQuantity = peopleEntries.reduce((sum, p) => sum + Number(p.quantity || 1), 0);
    if (item.itemType === "INDIVIDUAL" && totalQuantity > item.quantity) {
      warnings.push(
        `Item "${item.name}" allocated quantity (${totalQuantity}) exceeds available quantity (${item.quantity})`
      );
    }

    for (const { person_name: personName, quantity } of peopleEntries) {
      rows.push({
        receiptId,
        itemId: entry.item_id,
        personName,
        quantityAllocated: item.itemType === "INDIVIDUAL" ? Number(quantity || 1) : null,
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
  const owned = await findOwnedReceipt(req.params.receiptId, req.userId);
  if (!owned) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  const allocations = await prisma.itemAllocation.findMany({
    where: { receiptId: req.params.receiptId },
    include: { item: true },
  });

  const summary = {};
  for (const alloc of allocations) {
    if (!summary[alloc.personName]) summary[alloc.personName] = [];
    const qty = alloc.item.itemType === "INDIVIDUAL" && Number(alloc.quantityAllocated) > 1
      ? ` ×${alloc.quantityAllocated}`
      : "";
    summary[alloc.personName].push(`${alloc.item.name}${qty}`);
  }

  res.json({
    allocations: summary,
    status: allocations.length > 0 ? "ready_to_calculate" : "empty",
  });
});
