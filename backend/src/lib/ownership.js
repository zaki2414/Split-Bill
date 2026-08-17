import { prisma } from "./prisma.js";

// Confirms the receipt exists and belongs to this user - shared by every route
// that reaches a receipt indirectly (nested items/allocations/settlements),
// where the ownership check can't just be folded into a single findUnique.
export async function findOwnedReceipt(receiptId, userId) {
  return prisma.receipt.findFirst({ where: { id: receiptId, userId } });
}
