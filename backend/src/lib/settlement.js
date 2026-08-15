// Pure calculation, no DB access - easy to unit test.
//
// SHARED item: total_price split equally among distinct consumers.
// INDIVIDUAL item: each consumer pays unit_price * quantity_allocated (default 1).
// taxAmount (tax/service charge on top of item prices) is distributed proportionally
// to each person's item consumption, not split evenly - someone who ate more pays more tax.
export function calculateSettlements({ items, allocations, payerName, totalAmount, taxAmount = 0 }) {
  const allocationsByItem = new Map();
  for (const alloc of allocations) {
    if (!allocationsByItem.has(alloc.itemId)) allocationsByItem.set(alloc.itemId, []);
    allocationsByItem.get(alloc.itemId).push(alloc);
  }

  const warnings = [];
  const consumptionByPerson = {};

  for (const item of items) {
    const itemAllocations = allocationsByItem.get(item.id) || [];
    if (itemAllocations.length === 0) {
      warnings.push(`Item "${item.name}" has no consumers`);
      continue;
    }

    if (item.itemType === "SHARED") {
      const consumers = [...new Set(itemAllocations.map((a) => a.personName))];
      const share = Number(item.totalPrice) / consumers.length;
      for (const person of consumers) {
        consumptionByPerson[person] = (consumptionByPerson[person] || 0) + share;
      }
    } else if (item.itemType === "INDIVIDUAL") {
      const unitPrice =
        item.unitPrice != null ? Number(item.unitPrice) : Number(item.totalPrice) / item.quantity;
      for (const alloc of itemAllocations) {
        const qty = Number(alloc.quantityAllocated ?? 1);
        consumptionByPerson[alloc.personName] =
          (consumptionByPerson[alloc.personName] || 0) + unitPrice * qty;
      }
    } else {
      warnings.push(`Item "${item.name}" has unknown item_type "${item.itemType}"`);
    }
  }

  const tax = Number(taxAmount) || 0;
  if (tax > 0) {
    const subtotal = Object.values(consumptionByPerson).reduce((sum, v) => sum + v, 0);
    if (subtotal > 0) {
      for (const person of Object.keys(consumptionByPerson)) {
        const taxShare = (consumptionByPerson[person] / subtotal) * tax;
        consumptionByPerson[person] += taxShare;
      }
    } else {
      warnings.push(`Tax/service (${tax.toFixed(2)}) could not be distributed - no item consumption yet`);
    }
  }

  const settlements = [];
  for (const [person, amount] of Object.entries(consumptionByPerson)) {
    if (person === payerName) continue;
    if (amount <= 0) continue;
    settlements.push({ owerName: person, payerName, amount: round2(amount) });
  }

  const totalConsumed = Object.values(consumptionByPerson).reduce((sum, v) => sum + v, 0);
  const diff = Math.abs(totalConsumed - Number(totalAmount));
  if (diff > 0.01) {
    warnings.push(
      `Allocated total incl. tax (${totalConsumed.toFixed(2)}) does not match receipt total (${Number(totalAmount).toFixed(2)})`
    );
  }

  return { consumptionByPerson, settlements, warnings };
}

function round2(n) {
  return Math.round(n * 100) / 100;
}
