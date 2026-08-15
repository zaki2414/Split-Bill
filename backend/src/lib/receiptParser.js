// Best-effort line-based heuristic — receipt layouts vary a lot, so this is
// intentionally a rough first pass. The UX always shows extracted items in
// the editable Items step for the user to review/correct/delete.

// Charges on top of item prices - captured and returned as taxAmount, not treated as items.
const TAX_KEYWORDS = ["pajak", "ppn", "tax", "service charge", "service", "svc"];

// Recap/payment lines - not items, not extra charges, just discarded.
const SKIP_KEYWORDS = [
  "total", "subtotal", "sub total",
  "kembali", "tunai", "cash", "bayar", "change", "diskon", "discount",
  "no.", "meja", "table", "kasir", "cashier", "receipt", "struk", "invoice",
  "npwp", "telp", "terima kasih", "thank you",
];

const DRINK_KEYWORDS = [
  "es ", "teh", "kopi", "jus", "juice", "soda", "cola", "sprite",
  "air mineral", "milkshake", "coffee", "tea", "minuman", "susu",
];

// "<name> <price>" at end of line, price optionally prefixed with Rp
const PRICE_LINE = /^(.+?)\s+(?:Rp\.?\s*)?(\d{1,3}(?:[.,]\d{3})+|\d{3,})\s*$/;
// "<qty>x <name>" prefix
const QTY_PREFIX = /^(\d+)\s*[xX]\s*(.+)$/;

function guessCategory(name) {
  const lower = name.toLowerCase();
  return DRINK_KEYWORDS.some((kw) => lower.includes(kw)) ? "drink" : "food";
}

function parsePrice(raw) {
  return Number(raw.replace(/[.,]/g, ""));
}

// Returns { items, taxAmount } - taxAmount is the sum of any tax/service/PPN
// lines found, to be split proportionally by consumption at settlement time.
export function parseReceiptText(text) {
  if (!text) return { items: [], taxAmount: 0 };

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items = [];
  let taxAmount = 0;

  for (const line of lines) {
    const lower = line.toLowerCase();
    const match = line.match(PRICE_LINE);

    if (TAX_KEYWORDS.some((kw) => lower.includes(kw))) {
      if (match) taxAmount += parsePrice(match[2]);
      continue;
    }

    if (SKIP_KEYWORDS.some((kw) => lower.includes(kw))) continue;
    if (!match) continue;

    let [, namePart, priceRaw] = match;
    const price = parsePrice(priceRaw);
    if (!Number.isFinite(price) || price < 500) continue; // ignore junk/too-small "prices"

    let quantity = 1;
    const qtyMatch = namePart.match(QTY_PREFIX);
    if (qtyMatch) {
      quantity = Number(qtyMatch[1]);
      namePart = qtyMatch[2];
    }

    namePart = namePart.trim();
    if (!namePart || namePart.length > 60) continue;

    const category = guessCategory(namePart);

    items.push({
      name: namePart,
      category,
      itemType: category === "drink" ? "INDIVIDUAL" : "SHARED",
      totalPrice: price,
      quantity,
      unitPrice: quantity > 0 ? Math.round(price / quantity) : price,
    });
  }

  return { items, taxAmount };
}
