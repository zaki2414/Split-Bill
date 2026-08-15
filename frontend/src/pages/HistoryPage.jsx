import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import SettlementReport from "./SettlementReport";

const formatRupiah = (n) => `Rp${Math.round(Number(n)).toLocaleString("id-ID")}`;
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const STATUS_LABEL = {
  pending: "Belum dihitung",
  finalized: "Sudah dihitung",
  settled: "Lunas semua",
};

export default function HistoryPage() {
  const [selectedId, setSelectedId] = useState(null);

  const receiptsQuery = useQuery({
    queryKey: ["receipts"],
    queryFn: () => api.get("/api/receipts").then((res) => res.data),
  });

  if (selectedId) {
    return (
      <div className="space-y-6">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="text-sm text-slate-500 underline"
        >
          ← Kembali ke riwayat
        </button>
        <SettlementReport receiptId={selectedId} />
      </div>
    );
  }

  const receipts = receiptsQuery.data || [];

  return (
    <div className="space-y-4">
      {receiptsQuery.isLoading && <p className="text-sm text-slate-400">Memuat...</p>}
      {!receiptsQuery.isLoading && receipts.length === 0 && (
        <p className="text-sm text-slate-400">Belum ada split bill.</p>
      )}
      <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
        {receipts.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              onClick={() => setSelectedId(r.id)}
              className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-slate-50"
            >
              <div>
                <p className="font-medium text-slate-900">{r.title || r.merchantName || "Split Bill"}</p>
                <p className="text-slate-500">
                  Dibayar oleh {r.payerName} · {formatDate(r.createdAt)}
                </p>
              </div>
              <div className="text-right">
                <p className="font-medium text-slate-900">{formatRupiah(r.totalAmount)}</p>
                <p className="text-xs text-slate-400">{STATUS_LABEL[r.status] || r.status}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
