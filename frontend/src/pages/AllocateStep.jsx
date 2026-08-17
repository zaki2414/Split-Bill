import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Minus, Plus, Users } from "lucide-react";
import { api } from "../lib/api";
import { useSplitStore } from "../store/splitStore";
import { ITEM_TYPE_LABEL } from "../lib/labels";
import { BTN_ICON, BTN_LINK, BTN_PRIMARY, BTN_SECONDARY } from "../lib/buttonStyles";

const formatRupiah = (n) => `Rp${Math.round(Number(n)).toLocaleString("id-ID")}`;

export default function AllocateStep() {
  const receiptId = useSplitStore((s) => s.receiptId);
  const people = useSplitStore((s) => s.people);
  const setStep = useSplitStore((s) => s.setStep);
  const queryClient = useQueryClient();

  const formQuery = useQuery({
    queryKey: ["allocation-form", receiptId],
    queryFn: () => api.get(`/api/receipts/${receiptId}/allocation-form`).then((res) => res.data),
    enabled: !!receiptId,
    staleTime: 0,
    refetchOnMount: "always", // always get the latest saved allocations, never a stale cached copy
  });

  const [index, setIndex] = useState(0);
  const [selections, setSelections] = useState({}); // itemId -> { personName: quantity }

  // Pre-fill from any allocations already saved for this receipt (e.g. user navigated
  // back to this step), so re-visiting doesn't wipe out prior work. Waits for the network
  // fetch to actually settle before locking in - otherwise a stale cached response (from
  // before the allocations were saved) could win the race and initialize as empty.
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current || !formQuery.isSuccess || formQuery.isFetching) return;
    const grouped = {};
    for (const a of formQuery.data.existing_allocations || []) {
      if (!grouped[a.item_id]) grouped[a.item_id] = {};
      grouped[a.item_id][a.person_name] = a.quantity;
    }
    // Transport is a flat cost shared by the whole group - if nobody has allocated it
    // yet, default to everyone selected instead of making the user tick every box.
    for (const it of formQuery.data.items || []) {
      if (it.category === "transport" && !grouped[it.id]) {
        grouped[it.id] = {};
        for (const p of formQuery.data.people || []) grouped[it.id][p] = 1;
      }
    }
    setSelections(grouped);
    initialized.current = true;
  }, [formQuery.data, formQuery.isFetching, formQuery.isSuccess]);

  const items = formQuery.data?.items || [];
  const item = items[index];

  const togglePerson = (itemId, personName) => {
    setSelections((prev) => {
      const current = { ...(prev[itemId] || {}) };
      if (personName in current) delete current[personName];
      else current[personName] = 1;
      return { ...prev, [itemId]: current };
    });
  };

  const adjustQuantity = (itemId, personName, delta) => {
    setSelections((prev) => {
      const current = { ...(prev[itemId] || {}) };
      const nextQty = (current[personName] || 0) + delta;
      if (nextQty <= 0) delete current[personName];
      else current[personName] = nextQty;
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
            people: Object.entries(selections[it.id] || {}).map(([person_name, quantity]) => ({
              person_name,
              quantity,
            })),
          })),
        })
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allocation-form", receiptId] });
      setStep("summary");
    },
  });

  if (formQuery.isLoading) return <p className="text-sm font-medium text-olive-dark/60">Memuat...</p>;
  if (!item) return <p className="text-sm font-medium text-olive-dark/60">Tidak ada item yang tersedia.</p>;

  const isLast = index === items.length - 1;
  const isIndividual = item.type === "INDIVIDUAL";
  const currentSelection = selections[item.id] || {};
  const totalAllocatedQty = Object.values(currentSelection).reduce((sum, q) => sum + q, 0);
  const remainingStock = item.quantity - totalAllocatedQty;
  const allSelected = people.length > 0 && people.every((p) => p in currentSelection);

  const toggleSelectAll = () => {
    setSelections((prev) => {
      if (allSelected) return { ...prev, [item.id]: {} };
      if (!isIndividual) {
        const all = {};
        for (const p of people) all[p] = 1;
        return { ...prev, [item.id]: all };
      }
      // INDIVIDUAL: fill greedily, 1 each, until the item's quantity runs out
      const all = {};
      let remaining = item.quantity;
      for (const p of people) {
        if (remaining <= 0) break;
        all[p] = 1;
        remaining -= 1;
      }
      return { ...prev, [item.id]: all };
    });
  };

  return (
    <div className="space-y-6">
      <p className="text-xs font-extrabold tracking-wide text-olive-dark/60 uppercase">
        Item {index + 1} dari {items.length}
      </p>

      <div className="rounded-3xl border-2 border-olive-light/60 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-extrabold text-olive-darker">{item.name}</h3>
        <p className="mt-1 text-sm font-bold text-olive-dark">
          {formatRupiah(item.price)} · {ITEM_TYPE_LABEL[item.type] || item.type}
          {isIndividual && ` · Tersisa ${Math.max(remainingStock, 0)} dari ${item.quantity}`}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <p className="flex items-center gap-1.5 text-sm font-bold text-olive-dark">
            <Users className="h-4 w-4" strokeWidth={2.5} />
            Siapa yang memesan item ini?
          </p>
          <button type="button" onClick={toggleSelectAll} className={`text-xs ${BTN_LINK}`}>
            {allSelected ? "Batalkan Semua" : "Pilih Semua"}
          </button>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {people.map((personName) => {
            const qty = currentSelection[personName] || 0;
            const selected = qty > 0;
            // Once an INDIVIDUAL item's stock hits 0, block picking *new* people - but
            // an already-selected person can still be undone to free up stock again.
            const locked = isIndividual && !selected && remainingStock <= 0;
            return (
              <div
                key={personName}
                className={`rounded-2xl border-2 p-3 text-center transition ${
                  selected
                    ? "border-olive bg-olive/10 hover:bg-olive/20"
                    : locked
                      ? "border-olive-light/40 bg-cream/50"
                      : "border-olive-light bg-white hover:bg-cream"
                }`}
              >
                <button
                  type="button"
                  onClick={() => togglePerson(item.id, personName)}
                  disabled={locked}
                  aria-label={`Pilih ${personName}`}
                  aria-pressed={selected}
                  className={`flex w-full flex-col items-center gap-1.5 ${
                    locked ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                  }`}
                >
                  <span
                    className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                      selected ? "bg-olive text-white" : "border-2 border-olive-light"
                    }`}
                  >
                    {selected && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                  <span className="w-full truncate text-sm font-bold text-olive-darker">{personName}</span>
                </button>

                {selected && isIndividual && (
                  <div className="mt-2 flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => adjustQuantity(item.id, personName, -1)}
                      className={`${BTN_ICON} h-6 w-6 bg-olive-light/60 text-olive-darker hover:bg-olive-light active:scale-[0.9]`}
                      aria-label={`Kurangi jumlah untuk ${personName}`}
                    >
                      <Minus className="h-3 w-3" strokeWidth={3} />
                    </button>
                    <span className="w-4 text-sm font-extrabold text-olive-dark">{qty}</span>
                    <button
                      type="button"
                      onClick={() => adjustQuantity(item.id, personName, 1)}
                      disabled={remainingStock <= 0}
                      className={`${BTN_ICON} h-6 w-6 bg-olive-light/60 text-olive-darker hover:bg-olive-light active:scale-[0.9] disabled:opacity-30`}
                      aria-label={`Tambah jumlah untuk ${personName}`}
                    >
                      <Plus className="h-3 w-3" strokeWidth={3} />
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {Object.keys(currentSelection).length === 0 && (
          <p className="mt-4 rounded-2xl bg-coral/10 px-4 py-2.5 text-xs font-bold text-coral-dark">
            Belum ada peserta yang dipilih untuk item ini.
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => (index === 0 ? setStep("items") : setIndex((i) => i - 1))}
          className={`flex-1 cursor-pointer ${BTN_SECONDARY}`}
        >
          {index === 0 ? "Kembali ke Item" : "Sebelumnya"}
        </button>

        {isLast ? (
          <button
            type="button"
            onClick={() => submitBatch.mutate()}
            disabled={submitBatch.isPending}
            className={`flex-1 ${BTN_PRIMARY}`}
          >
            {submitBatch.isPending ? "Menyimpan..." : "Selesai, Lihat Ringkasan"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            className={`flex-1 cursor-pointer ${BTN_PRIMARY}`}
          >
            Item Selanjutnya
          </button>
        )}
      </div>

      {submitBatch.isError && (
        <p className="text-sm font-bold text-coral">Gagal menyimpan alokasi. Silakan coba lagi.</p>
      )}
    </div>
  );
}
