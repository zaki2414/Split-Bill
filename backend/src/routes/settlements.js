import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import { findOwnedReceipt } from "../lib/ownership.js";

export const settlementsRouter = Router();

// GET /api/settlements/:receiptId
settlementsRouter.get("/:receiptId", async (req, res) => {
  const owned = await findOwnedReceipt(req.params.receiptId, req.userId);
  if (!owned) {
    return res.status(404).json({ error: "Receipt not found" });
  }

  const settlements = await prisma.settlement.findMany({
    where: { receiptId: req.params.receiptId },
    orderBy: { createdAt: "asc" },
  });
  res.json(settlements);
});

// POST /api/settlements/:id/pay
settlementsRouter.post("/:id/pay", async (req, res) => {
  const existing = await prisma.settlement.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: "Settlement not found" });
  }
  const owned = await findOwnedReceipt(existing.receiptId, req.userId);
  if (!owned) {
    return res.status(404).json({ error: "Settlement not found" });
  }

  const { status = "paid", notes } = req.body;

  const settlement = await prisma.settlement.update({
    where: { id: req.params.id },
    data: {
      status,
      notes,
      paidAt: status === "paid" ? new Date() : null,
    },
  });

  const siblings = await prisma.settlement.findMany({ where: { receiptId: settlement.receiptId } });
  const allPaid = siblings.length > 0 && siblings.every((s) => s.status === "paid");
  await prisma.receipt.update({
    where: { id: settlement.receiptId },
    data: { status: allPaid ? "settled" : "finalized" },
  });

  res.json(settlement);
});
