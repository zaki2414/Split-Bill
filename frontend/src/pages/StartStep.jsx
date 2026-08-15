import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useSplitStore } from "../store/splitStore";

export default function StartStep() {
  const [title, setTitle] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [taxAmount, setTaxAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  const [people, setPeople] = useState([]);
  const [personDraft, setPersonDraft] = useState("");
  const [createdReceiptId, setCreatedReceiptId] = useState(null);
  const [imageFile, setImageFile] = useState(null);

  const setReceipt = useSplitStore((s) => s.setReceipt);
  const setStep = useSplitStore((s) => s.setStep);

  const createReceipt = useMutation({
    mutationFn: (payload) => api.post("/api/receipts", payload).then((res) => res.data),
    onSuccess: (receipt) => {
      setReceipt(receipt);
      setCreatedReceiptId(receipt.id);
    },
  });

  const uploadImage = useMutation({
    mutationFn: (file) => {
      const formData = new FormData();
      formData.append("image", file);
      return api
        .post(`/api/receipts/${createdReceiptId}/image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data);
    },
    onSuccess: async (data) => {
      if (data.extracted_items?.length > 0) {
        await Promise.all(
          data.extracted_items.map((item) =>
            api.post(`/api/receipts/${createdReceiptId}/items`, item)
          )
        );
      }
      setStep("items");
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

  const canSubmit = title && payerName && totalAmount && people.length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!canSubmit) return;
    createReceipt.mutate({
      title,
      payerName,
      totalAmount: Number(totalAmount),
      taxAmount: taxAmount ? Number(taxAmount) : 0,
      people,
    });
  };

  if (createdReceiptId) {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-slate-700">Foto struk (opsional)</label>
          <p className="mt-1 text-xs text-slate-400">
            Foto akan dikompres otomatis. Kalau OCR aktif, item-item akan dicoba
            diekstrak otomatis (tetap bisa dikoreksi di step Items).
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            className="mt-2 block w-full text-sm text-slate-700"
          />
        </div>

        {uploadImage.isError && (
          <p className="text-sm text-red-500">Gagal upload foto. Coba lagi atau lewati.</p>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setStep("items")}
            className="flex-1 rounded-md border border-slate-300 py-2.5 text-sm font-medium text-slate-700"
          >
            Lewati
          </button>
          <button
            type="button"
            onClick={() => (imageFile ? uploadImage.mutate(imageFile) : setStep("items"))}
            disabled={uploadImage.isPending}
            className="flex-1 rounded-md bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            {uploadImage.isPending ? "Mengupload..." : "Lanjut ke items"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700">Judul split bill</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Makan Malam Pizza Hut"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Total tagihan (Rp)</label>
        <p className="mt-1 text-xs text-slate-400">Total akhir di struk, sudah termasuk pajak/service.</p>
        <input
          type="number"
          min="0"
          value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          placeholder="120000"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Pajak / service charge (opsional, Rp)</label>
        <p className="mt-1 text-xs text-slate-400">
          Dibagi proporsional sesuai porsi makanan tiap orang, bukan rata.
        </p>
        <input
          type="number"
          min="0"
          value={taxAmount}
          onChange={(e) => setTaxAmount(e.target.value)}
          placeholder="12500"
          className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700">Siapa aja yang ikut split?</label>
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
            placeholder="Nama orang"
            className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={addPerson}
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Tambah
          </button>
        </div>
        {people.length > 0 && (
          <ul className="mt-3 flex flex-wrap gap-2">
            {people.map((name) => (
              <li
                key={name}
                className="flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
              >
                {name}
                <button
                  type="button"
                  onClick={() => removePerson(name)}
                  className="text-slate-400 hover:text-red-500"
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
          <label className="block text-sm font-medium text-slate-700">Siapa yang bayar?</label>
          <select
            value={payerName}
            onChange={(e) => setPayerName(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          >
            {people.map((name) => (
              <option key={name} value={name}>
                {name}
              </option>
            ))}
          </select>
        </div>
      )}

      {createReceipt.isError && (
        <p className="text-sm text-red-500">Gagal membuat split bill. Coba lagi.</p>
      )}

      <button
        type="submit"
        disabled={!canSubmit || createReceipt.isPending}
        className="w-full rounded-md bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        {createReceipt.isPending ? "Membuat..." : "Lanjut"}
      </button>
    </form>
  );
}
