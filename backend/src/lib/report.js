function formatRupiah(amount) {
  return `Rp${Math.round(Number(amount)).toLocaleString("id-ID")}`;
}

function formatTanggal(date) {
  return new Date(date).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// Groups allocations by person into a short "what they ordered" list, no prices -
// e.g. { Grace: ["Pallubasa 1x", "Nasi Putih 1x"] } - just enough context under each
// payment line to explain what it's for.
function summarizeConsumption(allocations) {
  const byPerson = {};
  for (const alloc of allocations) {
    if (!byPerson[alloc.personName]) byPerson[alloc.personName] = [];
    const qty = alloc.quantityAllocated ? Number(alloc.quantityAllocated) : 1;
    byPerson[alloc.personName].push(`${alloc.item.name} ${qty}x`);
  }
  return byPerson;
}

// Builds a plain-language settlement summary, e.g.:
// "Budi harus membayar: Rp60.000" followed by a short line of what they ordered.
export function formatSettlementReport(receipt, settlements, allocations = []) {
  const heading = receipt.title || receipt.merchantName || "BagiRata";
  const consumption = summarizeConsumption(allocations);
  const lines = settlements.map(
    (s) => `${s.owerName} harus membayar: ${formatRupiah(s.amount)}`
  );

  const tax = Number(receipt.taxAmount) || 0;
  const subtotal = Number(receipt.totalAmount) - tax;

  const detailLines = settlements.flatMap((s, i) => {
    const items = consumption[s.owerName] || [];
    const block = [`- ${s.owerName} harus membayar: ${formatRupiah(s.amount)}`];
    if (items.length > 0) block.push(`  ${items.join(", ")}`);
    if (i < settlements.length - 1) block.push("");
    return block;
  });

  const text = [
    heading,
    receipt.merchantName ? `(${receipt.merchantName})` : null,
    receipt.receiptDate ? formatTanggal(receipt.receiptDate) : null,
    `Dibayar oleh: ${receipt.payerName}`,
    "",
    `Subtotal: ${formatRupiah(subtotal)}`,
    tax > 0 ? `Pajak/Biaya Layanan: ${formatRupiah(tax)}` : null,
    `Total: ${formatRupiah(receipt.totalAmount)}`,
    "",
    lines.length > 0 ? "Rincian Pembagian:" : "Belum ada rincian pembagian untuk dilaporkan.",
    ...detailLines,
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { text, lines };
}
