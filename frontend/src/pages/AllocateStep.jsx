import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useSplitStore } from "../store/splitStore";

const formatRupiah = (n) => `Rp${Math.round(Number(n)).toLocaleString("id-ID")}`;

export default function AllocateStep() {
  const receiptId = useSplitStore((s) => s.receiptId);
  const people = useSplitStore((s) => s.people);
  const setStep = useSplitStore((s) => s.setStep);

  const formQuery = useQuery({
    queryKey: ["allocation-form", receiptId],
    queryFn: () => api.get(`/api/receipts/${receiptId}/allocation-form`).then((res) => res.data),
    enabled: !!receiptId,
  });

  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState({}); // itemId -> Set(personName)

  const items = formQuery.data?.items || [];
  const item = items[index];

  const togglePerson = (itemId, personName) => {
    setSelections((prev) => {
      const current = new Set(prev[itemId] || []);
      if (current.has(personName)) current.delete(personName);
      else current.add(personName);
      return { ...prev, [itemId]: current };
    });
  };

  const submitBatch = useMutation({
    mutationFn: () =>
      api
        .post("/api/allocations/batch", {
          receipt_id: receiptId,
          allocations: items.map((it) => ({
            item_id: it.id,
            person_names: [...(selections[it.id] || [])],
          })),
        })
        .then((res) => res.data),
    onSuccess: () => setStep("summary"),
  });

  if (formQuery.isLoading) return <p className="text-sm text-slate-400">Memuat...</p>;
  if (!item) return <p className="text-sm text-slate-400">Tidak ada item.</p>;

  const isLast = index === items.length - 1;
  const currentSelection = selections[item.id] || new Set();

  return (
    <div className="space-y-6">
      <p className="text-xs font-medium text-slate-400">
        Item {index + 1} dari {items.length}
      </p>

      <div className="rounded-lg border border-slate-200 p-5">
        <h3 className="text-lg font-semibold text-slate-900">{item.name}</h3>
        <p className="mt-1 text-sm text-slate-500">
          {formatRupiah(item.price)} · {item.type}
        </p>
        <p className="mt-3 text-sm font-medium text-slate-700">Siapa aja yang makan/pakai ini?</p>

        <ul className="mt-2 space-y-1">
          {people.map((personName) => (
            <li key={personName}>
              <label className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={currentSelection.has(personName)}
                  onChange={() => togglePerson(item.id, personName)}
                  className="h-4 w-4 rounded border-slate-300"
                />
                {personName}
              </label>
            </li>
          ))}
        </ul>

        {currentSelection.size === 0 && (
          <p className="mt-3 text-xs text-amber-600">Belum ada yang dipilih untuk item ini.</p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={index === 0}
          className="flex-1 rounded-md border border-slate-300 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
        >
          Sebelumnya
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={() => submitBatch.mutate()}
            disabled={submitBatch.isPending}
            className="flex-1 rounded-md bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {submitBatch.isPending ? "Menyimpan..." : "Selesai, lihat ringkasan"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            className="flex-1 rounded-md bg-slate-900 py-2 text-sm font-semibold text-white"
          >
            Item selanjutnya
          </button>
        )}
      </div>

      {submitBatch.isError && (
        <p className="text-sm text-red-500">Gagal menyimpan alokasi. Coba lagi.</p>
      )}
    </div>
  );
}
