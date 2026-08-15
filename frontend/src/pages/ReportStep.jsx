import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useSplitStore } from "../store/splitStore";

const formatRupiah = (n) => `Rp${Math.round(Number(n)).toLocaleString("id-ID")}`;

export default function ReportStep() {
  const receiptId = useSplitStore((s) => s.receiptId);
  const reset = useSplitStore((s) => s.reset);
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  const reportQuery = useQuery({
    queryKey: ["report", receiptId],
    queryFn: () => api.get(`/api/receipts/${receiptId}/report`).then((res) => res.data),
    enabled: !!receiptId,
  });

  const settlementsQuery = useQuery({
    queryKey: ["settlements", receiptId],
    queryFn: () => api.get(`/api/settlements/${receiptId}`).then((res) => res.data),
    enabled: !!receiptId,
  });

  const markPaid = useMutation({
    mutationFn: (settlementId) => api.post(`/api/settlements/${settlementId}/pay`, { status: "paid" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["settlements", receiptId] }),
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
      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <pre className="whitespace-pre-wrap font-sans text-sm text-slate-800">
          {reportQuery.data?.text || (reportQuery.isLoading ? "Memuat..." : "")}
        </pre>
      </div>

      <button
        type="button"
        onClick={handleCopy}
        className="w-full rounded-md border border-slate-300 py-2 text-sm font-medium text-slate-700"
      >
        {copied ? "Tersalin!" : "Salin laporan"}
      </button>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Status pembayaran</h3>
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {settlements.map((s) => (
            <li key={s.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <span>
                {s.owerName} → {s.payerName}: {formatRupiah(s.amount)}
              </span>
              {s.status === "paid" ? (
                <span className="text-xs font-medium text-emerald-600">Lunas</span>
              ) : (
                <button
                  onClick={() => markPaid.mutate(s.id)}
                  disabled={markPaid.isPending}
                  className="rounded-md bg-slate-900 px-3 py-1 text-xs font-medium text-white disabled:opacity-40"
                >
                  Tandai lunas
                </button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={reset}
        className="w-full rounded-md border border-slate-300 py-2.5 text-sm font-medium text-slate-700"
      >
        Mulai split bill baru
      </button>
    </div>
  );
}
