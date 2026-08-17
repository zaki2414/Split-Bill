import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { api } from "../lib/api";
import SettlementReport from "./SettlementReport";

const PAGE_SIZE = 5;

const formatRupiah = (n) => `Rp${Math.round(Number(n)).toLocaleString("id-ID")}`;
const formatDate = (iso) =>
  new Date(iso).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });

const STATUS_STYLE = {
  pending: { label: "Belum Dihitung", className: "bg-coral/10 text-coral-dark" },
  finalized: { label: "Sudah Dihitung", className: "bg-olive-light/50 text-olive-darker" },
  settled: { label: "Lunas Semua", className: "bg-olive text-white" },
};

export default function HistoryPage() {
  const [selectedId, setSelectedId] = useState(null);
  const [page, setPage] = useState(1);
  const [detailVisible, setDetailVisible] = useState(false);

  const receiptsQuery = useQuery({
    queryKey: ["receipts"],
    queryFn: () => api.get("/api/receipts").then((res) => res.data),
  });

  // Fades + slides the detail panel in a beat after it mounts, rather than popping in instantly.
  useEffect(() => {
    if (!selectedId) {
      setDetailVisible(false);
      return;
    }
    setDetailVisible(false);
    const frame = requestAnimationFrame(() => setDetailVisible(true));
    return () => cancelAnimationFrame(frame);
  }, [selectedId]);

  const receipts = receiptsQuery.data || [];
  const totalPages = Math.max(1, Math.ceil(receipts.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageReceipts = receipts.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const selectedReceipt = receipts.find((r) => r.id === selectedId);

  return (
    <div className="flex flex-col gap-4 sm:flex-row">
        <div className={`transition-all duration-300 ${selectedId ? "sm:w-[38%]" : "w-full"}`}>
          {receiptsQuery.isLoading && <p className="text-sm font-medium text-olive-dark/60">Memuat...</p>}
          {!receiptsQuery.isLoading && receipts.length === 0 && (
            <p className="rounded-3xl border-2 border-olive-light/60 bg-white p-6 text-center text-sm font-bold text-olive-dark/60">
              Belum ada riwayat BagiRata.
            </p>
          )}

          {receipts.length > 0 && (
            <>
              <ul className="divide-y-2 divide-cream overflow-hidden rounded-3xl border-2 border-olive-light/60 bg-white">
                {pageReceipts.map((r) => {
                  const status = STATUS_STYLE[r.status] || {
                    label: r.status,
                    className: "bg-cream text-olive-dark",
                  };
                  const isActive = r.id === selectedId;
                  return (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        className={`flex w-full cursor-pointer items-center justify-between px-5 py-4 text-left text-sm transition ${
                          isActive ? "bg-olive/10 hover:bg-olive/15" : "hover:bg-cream/60"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="truncate font-extrabold text-olive-darker">
                            {r.title || r.merchantName || "BagiRata"}
                          </p>
                          <p className="truncate font-medium text-olive-dark/60">
                            Dibayar oleh {r.payerName} · {formatDate(r.receiptDate || r.createdAt)}
                          </p>
                        </div>
                        <div className="ml-3 shrink-0 text-right">
                          <p className="font-extrabold text-olive-dark">{formatRupiah(r.totalAmount)}</p>
                          <span
                            className={`mt-1 inline-block rounded-full px-2.5 py-1 text-xs font-bold ${status.className}`}
                          >
                            {status.label}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="mt-4 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex cursor-pointer items-center gap-1 rounded-full border-2 border-olive-light bg-white px-3 py-1.5 text-xs font-extrabold text-olive-dark transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" strokeWidth={3} />
                    Sebelumnya
                  </button>
                  <span className="text-xs font-bold text-olive-dark/70">
                    Halaman {currentPage} dari {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex cursor-pointer items-center gap-1 rounded-full border-2 border-olive-light bg-white px-3 py-1.5 text-xs font-extrabold text-olive-dark transition hover:bg-cream disabled:cursor-not-allowed disabled:opacity-30"
                  >
                    Selanjutnya
                    <ChevronRight className="h-3.5 w-3.5" strokeWidth={3} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {selectedId && (
          <div
            className={`transition-all duration-300 sm:flex-1 ${
              detailVisible ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
            }`}
          >
            <div className="rounded-3xl border-2 border-olive-light/60 bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="truncate text-sm font-extrabold text-olive-darker">
                  {selectedReceipt?.title || selectedReceipt?.merchantName || "Detail BagiRata"}
                </p>
                <button
                  type="button"
                  onClick={() => setSelectedId(null)}
                  aria-label="Tutup detail"
                  className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-olive-dark/60 transition hover:bg-cream hover:text-coral"
                >
                  <X className="h-4 w-4" strokeWidth={2.5} />
                </button>
              </div>
              <SettlementReport receiptId={selectedId} />
            </div>
          </div>
        )}
      </div>
  );
}
