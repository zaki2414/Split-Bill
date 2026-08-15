import { Router } from "express";
import { prisma } from "../lib/prisma.js";

export const settlementsRouter = Router();

// GET /api/settlements/:receiptId
settlementsRouter.get("/:receiptId", async (req, res) => {
  const settlements = await prisma.settlement.findMany({
    where: { receiptId: req.params.receiptId },
    orderBy: { createdAt: "asc" },
  });
  res.json(settlements);
});

// POST /api/settlements/:id/pay
settlementsRouter.post("/:id/pay", async (req, res) => {
  const { status = "paid", notes } = req.body;

  const settlement = await prisma.settlement.update({
    where: { id: req.params.id },
    data: {
      status,
      notes,
      paidAt: status === "paid" ? new Date() : null,
    },
  });

  res.json(settlement);
});
