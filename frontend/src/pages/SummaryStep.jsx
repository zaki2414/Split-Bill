import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useSplitStore } from "../store/splitStore";

export default function SummaryStep() {
  const receiptId = useSplitStore((s) => s.receiptId);
  const setStep = useSplitStore((s) => s.setStep);
  const [warnings, setWarnings] = useState([]);

  const summaryQuery = useQuery({
    queryKey: ["allocation-summary", receiptId],
    queryFn: () => api.get(`/api/allocations/${receiptId}/summary`).then((res) => res.data),
    enabled: !!receiptId,
  });

  const calculate = useMutation({
    mutationFn: () =>
      api.post(`/api/receipts/${receiptId}/settlements/calculate`).then((res) => res.data),
    onSuccess: (data) => setWarnings(data.warnings || []),
  });

  const allocations = summaryQuery.data?.allocations || {};

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">Ringkasan alokasi</h3>
        {summaryQuery.isLoading && <p className="text-sm text-slate-400">Memuat...</p>}
        <ul className="space-y-3 rounded-lg border border-slate-200 p-4">
          {Object.entries(allocations).map(([person, itemNames]) => (
            <li key={person}>
              <p className="text-sm font-medium text-slate-900">{person}</p>
              <p className="text-sm text-slate-500">{itemNames.join(", ")}</p>
            </li>
          ))}
        </ul>
      </div>

      <button
        type="button"
        onClick={() => setStep("allocate")}
        className="text-sm text-slate-500 underline"
      >
        Kembali edit alokasi
      </button>

      {warnings.length > 0 && (
        <div className="rounded-md bg-amber-50 p-3 text-sm text-amber-700">
          <p className="font-medium">Perhatian:</p>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {!calculate.isSuccess || warnings.length > 0 ? (
        <button
          type="button"
          onClick={() => calculate.mutate()}
          disabled={calculate.isPending}
          className="w-full rounded-md bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        >
          {calculate.isPending ? "Menghitung..." : "Hitung settlement"}
        </button>
      ) : null}

      {calculate.isSuccess && (
        <button
          type="button"
          onClick={() => setStep("report")}
          className="w-full rounded-md bg-emerald-600 py-2.5 text-sm font-semibold text-white"
        >
          Lanjut ke laporan
        </button>
      )}

      {calculate.isError && (
        <p className="text-sm text-red-500">Gagal menghitung settlement. Coba lagi.</p>
      )}
    </div>
  );
}
