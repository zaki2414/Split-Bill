import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ArrowLeft, ArrowRight } from "lucide-react";
import { api } from "../lib/api";
import { useSplitStore } from "../store/splitStore";

const LABEL = "block text-sm font-bold text-olive-dark";
const HINT = "mt-1 text-xs font-medium text-olive-dark/60";
const INPUT =
  "mt-1 w-full rounded-2xl border-2 border-olive-light bg-white px-4 py-2.5 text-sm font-medium text-olive-darker placeholder:text-olive-dark/30 focus:border-olive focus:outline-none focus:ring-4 focus:ring-olive/20";
const BTN_PRIMARY =
  "rounded-full bg-olive px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-olive/30 transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none";

const formatRupiah = (n) => `Rp${Math.round(Number(n) || 0).toLocaleString("id-ID")}`;

export default function SummaryStep() {
  const receiptId = useSplitStore((s) => s.receiptId);
  const setStep = useSplitStore((s) => s.setStep);
  const queryClient = useQueryClient();
  const [warnings, setWarnings] = useState([]);
  const [taxAmount, setTaxAmount] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [totalTouched, setTotalTouched] = useState(false);

  const summaryQuery = useQuery({
    queryKey: ["allocation-summary", receiptId],
    queryFn: () =>
      api.get(`/api/allocations/${receiptId}/summary`).then((res) => res.data),
    enabled: !!receiptId,
  });

  const itemsQuery = useQuery({
    queryKey: ["items", receiptId],
    queryFn: () => api.get(`/api/receipts/${receiptId}/items`).then((res) => res.data),
    enabled: !!receiptId,
  });

  const receiptQuery = useQuery({
    queryKey: ["receipt", receiptId],
    queryFn: () => api.get(`/api/receipts/${receiptId}`).then((res) => res.data),
    enabled: !!receiptId,
  });

  // Tax may already be set - e.g. OCR picked up a PPN/service line during photo upload -
  // so pick that up as the starting value instead of always starting blank.
  useEffect(() => {
    if (!receiptQuery.isSuccess) return;
    const existing = Number(receiptQuery.data.taxAmount) || 0;
    setTaxAmount(existing > 0 ? String(existing) : "");
  }, [receiptQuery.isSuccess, receiptQuery.data?.taxAmount]);

  const items = itemsQuery.data || [];
  const subtotal = items.reduce((sum, item) => sum + Number(item.totalPrice), 0);
  const estimatedTotal = subtotal + (Number(taxAmount) || 0);

  // Total Tagihan defaults to the live subtotal+pajak estimate so there's nothing to
  // retype - but it stays a real, editable field: if what's printed on the receipt
  // differs (rounding, an item that got missed), typing over it is what lets the
  // settlement check still catch that mismatch instead of silently trusting the sum.
  useEffect(() => {
    if (totalTouched) return;
    setTotalAmount(estimatedTotal > 0 ? String(estimatedTotal) : "");
  }, [estimatedTotal, totalTouched]);

  const calculate = useMutation({
    mutationFn: async () => {
      await api.put(`/api/receipts/${receiptId}`, {
        totalAmount: Number(totalAmount),
        taxAmount: Number(taxAmount) || 0,
      });
      const res = await api.post(`/api/receipts/${receiptId}/settlements/calculate`);
      return res.data;
    },
    onSuccess: (data) => {
      setWarnings(data.warnings || []);
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
    },
  });

  const allocations = summaryQuery.data?.allocations || {};
  const canCalculate = Number(totalAmount) > 0;

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-extrabold text-olive-dark">
          Ringkasan Alokasi
        </h3>
        {summaryQuery.isLoading && (
          <p className="text-sm font-medium text-olive-dark/60">Memuat...</p>
        )}
        <ul className="space-y-4 rounded-3xl border-2 border-olive-light/60 bg-white p-6 shadow-sm">
          {Object.entries(allocations).map(([person, itemNames]) => (
            <li key={person}>
              <p className="text-sm font-extrabold text-olive-darker">
                {person}
              </p>
              <p className="text-sm font-medium text-olive-dark/70">
                {itemNames.join(", ")}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-4 rounded-3xl border-2 border-olive-light/60 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between text-sm">
          <span className="font-bold text-olive-dark">Subtotal Item</span>
          <span className="font-extrabold text-olive-darker">{formatRupiah(subtotal)}</span>
        </div>

        <div>
          <label className={LABEL}>Pajak / Biaya Layanan (Opsional, Rp)</label>
          <p className={HINT}>
            Akan dibagi secara proporsional berdasarkan porsi konsumsi setiap peserta, bukan
            dibagi rata.
          </p>
          <input
            type="number"
            min="0"
            value={taxAmount}
            onChange={(e) => setTaxAmount(e.target.value)}
            placeholder="12500"
            className={INPUT}
          />
        </div>

        <div>
          <label className={LABEL}>Total Tagihan (Sesuai Struk, Rp)</label>
          <p className={HINT}>
            Otomatis terisi dari Subtotal + Pajak di atas - sesuaikan kalau angkanya beda dengan
            yang tertera di struk asli.
          </p>
          <input
            type="number"
            min="0"
            value={totalAmount}
            onChange={(e) => {
              setTotalAmount(e.target.value);
              setTotalTouched(true);
            }}
            placeholder="120000"
            className={INPUT}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setStep("allocate")}
        className="cursor-pointer flex items-center gap-1 text-sm font-bold text-olive-dark underline decoration-olive-light decoration-2 underline-offset-2"
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={2.5} />
        Kembali ke Alokasi
      </button>

      {warnings.length > 0 && (
        <div className="rounded-2xl bg-coral/10 p-4 text-sm text-coral-dark">
          <p className="flex items-center gap-1.5 font-extrabold">
            <AlertTriangle className="h-4 w-4" strokeWidth={2.5} />
            Perhatian:
          </p>
          <ul className="mt-1 list-disc pl-5 font-medium">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <button
        type="button"
        onClick={() => calculate.mutate()}
        disabled={calculate.isPending || !canCalculate}
        className={`w-full cursor-pointer ${BTN_PRIMARY}`}
      >
        {calculate.isPending
          ? "Menghitung..."
          : calculate.isSuccess
            ? "Hitung Ulang"
            : "Hitung Pembagian"}
      </button>

      {calculate.isSuccess && (
        <button
          type="button"
          onClick={() => setStep("report")}
          className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-full bg-olive-dark px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-olive-dark/30 transition active:scale-[0.98]"
        >
          Lanjutkan ke Laporan
          <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        </button>
      )}

      {calculate.isError && (
        <p className="text-sm font-bold text-coral">
          Gagal menghitung pembagian biaya. Silakan coba lagi.
        </p>
      )}
    </div>
  );
}
