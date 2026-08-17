import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useSplitStore } from "../store/splitStore";
import PhotoUpload from "../components/PhotoUpload";
import { BTN_PRIMARY } from "../lib/buttonStyles";

const LABEL = "block text-sm font-bold text-olive-dark";
const INPUT =
  "mt-1 w-full rounded-2xl border-2 border-olive-light bg-white px-4 py-2.5 text-sm font-medium text-olive-darker placeholder:text-olive-dark/30 focus:border-olive focus:outline-none focus:ring-4 focus:ring-olive/20";

const today = () => new Date().toISOString().slice(0, 10);

export default function StartStep() {
  const receiptId = useSplitStore((s) => s.receiptId);
  const storedTitle = useSplitStore((s) => s.title);
  const storedReceiptDate = useSplitStore((s) => s.receiptDate);
  const storedPayerName = useSplitStore((s) => s.payerName);
  const storedPeople = useSplitStore((s) => s.people);
  const setReceipt = useSplitStore((s) => s.setReceipt);
  const setStep = useSplitStore((s) => s.setStep);
  const isEditing = !!receiptId;

  const [title, setTitle] = useState(storedTitle || "");
  const [receiptDate, setReceiptDate] = useState(storedReceiptDate || today());
  const [payerName, setPayerName] = useState(storedPayerName || "");
  const [people, setPeople] = useState(storedPeople || []);
  const [personDraft, setPersonDraft] = useState("");
  const [showPhotoPanel, setShowPhotoPanel] = useState(false);

  const saveReceipt = useMutation({
    mutationFn: (payload) =>
      isEditing
        ? api.put(`/api/receipts/${receiptId}`, payload).then((res) => res.data)
        : api.post("/api/receipts", payload).then((res) => res.data),
    onSuccess: (receipt) => {
      setReceipt(receipt);
      setShowPhotoPanel(true); // always reachable, incl. when editing - lets people re-upload/replace the receipt photo
    },
  });

  const addPerson = () => {
    const name = personDraft.trim();
    if (!name || people.includes(name)) return;
    setPeople([...people, name]);
    if (!payerName) setPayerName(name);
    setPersonDraft("");
  };

  const removePerson = (name) => {
    setPeople(people.filter((p) => p !== name));
    if (payerName === name) setPayerName("");
  };

  const canSubmit = title && payerName && people.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    saveReceipt.mutate({
      title,
      receiptDate,
      payerName,
      people,
    });
  };

  if (showPhotoPanel) {
    return (
      <PhotoUpload
        receiptId={receiptId}
        cancelLabel="Lewati"
        submitLabel="Lanjutkan ke Daftar Item"
        onCancel={() => setStep("items")}
        onDone={() => setStep("items")}
      />
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-3xl border-2 border-olive-light/60 bg-white p-6 shadow-sm"
    >
      <div>
        <label className={LABEL}>Judul BagiRata</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Makan Malam Pizza Hut"
          className={INPUT}
        />
      </div>

      <div>
        <label className={LABEL}>Tanggal Nota</label>
        <input
          type="date"
          value={receiptDate}
          onChange={(e) => setReceiptDate(e.target.value)}
          max={today()}
          className={INPUT}
        />
      </div>

      <div>
        <label className={LABEL}>Siapa Saja yang Terlibat?</label>
        <div className="mt-1 flex gap-2">
          <input
            value={personDraft}
            onChange={(e) => setPersonDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPerson();
              }
            }}
            placeholder="Nama peserta"
            className={`flex-1 ${INPUT}`}
          />
          <button
            type="button"
            onClick={addPerson}
            className="mt-1 cursor-pointer rounded-full bg-olive-dark px-5 py-2.5 text-sm font-extrabold text-white transition hover:bg-olive-darker active:scale-[0.98]"
          >
            Tambah
          </button>
        </div>
        {people.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {people.map((name) => (
              <li
                key={name}
                className="flex items-center gap-1.5 rounded-full bg-olive-light/60 px-3.5 py-1.5 text-sm font-bold text-olive-darker"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removePerson(name)}
                  className="text-olive-dark/60 hover:text-coral"
                  aria-label={`Hapus ${name}`}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {people.length > 0 && (
        <div>
          <label className={LABEL}>Siapa yang Melakukan Pembayaran?</label>
          <select value={payerName} onChange={(e) => setPayerName(e.target.value)} className={INPUT}>
            {people.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {saveReceipt.isError && (
        <p className="text-sm font-bold text-coral">Gagal menyimpan BagiRata. Silakan coba lagi.</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || saveReceipt.isPending}
        className={`w-full cursor-pointer ${BTN_PRIMARY}`}
      >
        {saveReceipt.isPending ? "Menyimpan..." : isEditing ? "Simpan Perubahan" : "Lanjutkan"}
      </button>
    </form>
  );
}
