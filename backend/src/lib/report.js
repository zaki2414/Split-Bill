function formatRupiah(amount) {
  return `Rp${Math.round(Number(amount)).toLocaleString("id-ID")}`;
}

// Builds a plain-language settlement summary, e.g.:
// "Budi bayar ke Adi: Rp60.000"
export function formatSettlementReport(receipt, settlements) {
  const heading = receipt.title || receipt.merchantName || "BagiRata";
  const lines = settlements.map(
    (s) => `${s.owerName} harus membayar: ${formatRupiah(s.amount)}`
  );

  const tax = Number(receipt.taxAmount) || 0;
  const subtotal = Number(receipt.totalAmount) - tax;

  const text = [
    heading,
    receipt.merchantName ? `(${receipt.merchantName})` : null,
    `Dibayar oleh: ${receipt.payerName}`,
    "",
    `Subtotal: ${formatRupiah(subtotal)}`,
    tax > 0 ? `Pajak/Biaya Layanan: ${formatRupiah(tax)}` : null,
    `Total: ${formatRupiah(receipt.totalAmount)}`,
    "",
    lines.length > 0 ? "Rincian Pembagian:" : "Belum ada rincian pembagian untuk dilaporkan.",
    ...lines.map((line) => `- ${line}`),
  ]
    .filter((line) => line !== null)
    .join("\n");

  return { text, lines };
}
