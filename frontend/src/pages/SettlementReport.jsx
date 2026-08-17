import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy } from "lucide-react";
import { api } from "../lib/api";

const formatRupiah = (n) =>
  `Rp${Math.round(Number(n)).toLocaleString("id-ID")}`;

// Text report + per-settlement paid status for a given receipt.
// Shared between the wizard's final step and the history detail view.
export default function SettlementReport({ receiptId }) {
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const reportQuery = useQuery({
    queryKey: ["report", receiptId],
    queryFn: () =>
      api.get(`/api/receipts/${receiptId}/report`).then((res) => res.data),
    enabled: !!receiptId,
  });

  const settlementsQuery = useQuery({
    queryKey: ["settlements", receiptId],
    queryFn: () =>
      api.get(`/api/settlements/${receiptId}`).then((res) => res.data),
    enabled: !!receiptId,
  });

  const markPaid = useMutation({
    mutationFn: (settlementId) =>
      api.post(`/api/settlements/${settlementId}/pay`, { status: "paid" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settlements", receiptId] });
      queryClient.invalidateQueries({ queryKey: ["receipts"] });
    },
  });

  const handleCopy = async () => {
    if (!reportQuery.data?.text) return;
    await navigator.clipboard.writeText(reportQuery.data.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const settlements = settlementsQuery.data || [];

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-olive-dark p-6 shadow-lg shadow-olive-dark/20">
        <pre className="font-sans text-sm font-bold whitespace-pre-wrap text-cream">
          {reportQuery.data?.text || (reportQuery.isLoading ? "Memuat..." : "")}
        </pre>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-olive-light bg-white py-3 text-sm font-extrabold text-olive-dark transition hover:bg-cream active:scale-[0.98]"
      >
        {copied ? (
          <>
            <Check className="h-4 w-4" strokeWidth={2.5} />
            Tersalin
          </>
        ) : (
          <>
            <Copy className="h-4 w-4" strokeWidth={2.5} />
            Salin Laporan
          </>
        )}
      </button>

      <div>
        <h3 className="mb-2 text-sm font-extrabold text-olive-dark">
          Status Pembayaran
        </h3>
        <ul className="divide-y-2 divide-cream overflow-hidden rounded-3xl border-2 border-olive-light/60 bg-white">
          {settlements.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between gap-3 px-5 py-4 text-sm"
            >
              <div className="min-w-0 flex-1">
                <span className="font-bold text-olive-darker">
                  {s.owerName} → {s.payerName}
                </span>
                <p className="font-extrabold text-olive-dark">
                  {formatRupiah(s.amount)}
                </p>
              </div>
              {s.status === "paid" ? (
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-olive-light/50 px-3 py-1.5 text-xs font-extrabold whitespace-nowrap text-olive-darker">
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  Lunas
                </span>
              ) : (
                <button
                  onClick={() => markPaid.mutate(s.id)}
                  disabled={markPaid.isPending}
                  className="shrink-0 cursor-pointer rounded-full bg-olive px-4 py-2 text-xs font-extrabold whitespace-nowrap text-white shadow-sm transition hover:bg-olive/80 active:scale-[0.98] disabled:opacity-40"
                >
                  Tandai Lunas
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
