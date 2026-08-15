import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useSplitStore } from "../store/splitStore";

const CATEGORY_DEFAULT_TYPE = {
  food: "SHARED",
  drink: "INDIVIDUAL",
  transport: "SHARED",
  other: "SHARED",
};

const PREVIEW_TEXT = {
  SHARED: "akan dibagi rata ke semua yang makan",
  INDIVIDUAL: "dihitung per orang sesuai jumlah yang diambil",
};

const formatRupiah = (n) => `Rp${Math.round(Number(n)).toLocaleString("id-ID")}`;

export default function ItemsStep() {
  const receiptId = useSplitStore((s) => s.receiptId);
  const setStep = useSplitStore((s) => s.setStep);
  const setItems = useSplitStore((s) => s.setItems);
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [category, setCategory] = useState("food");
  const [totalPrice, setTotalPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [itemType, setItemType] = useState(CATEGORY_DEFAULT_TYPE.food);
  const [typeTouched, setTypeTouched] = useState(false);

  const itemsQuery = useQuery({
    queryKey: ["items", receiptId],
    queryFn: () => api.get(`/api/receipts/${receiptId}/items`).then((res) => res.data),
    enabled: !!receiptId,
  });

  const addItem = useMutation({
    mutationFn: (payload) => api.post(`/api/receipts/${receiptId}/items`, payload).then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", receiptId] });
      setName("");
      setTotalPrice("");
      setQuantity("1");
      setTypeTouched(false);
      setItemType(CATEGORY_DEFAULT_TYPE[category]);
    },
  });

  const deleteItem = useMutation({
    mutationFn: (itemId) => api.delete(`/api/receipts/${receiptId}/items/${itemId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["items", receiptId] }),
  });

  const handleCategoryChange = (value) => {
    setCategory(value);
    if (!typeTouched) setItemType(CATEGORY_DEFAULT_TYPE[value]);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!name || !totalPrice || !quantity) return;
    addItem.mutate({
      name,
      category,
      totalPrice: Number(totalPrice),
      quantity: Number(quantity),
      itemType,
    });
  };

  const items = itemsQuery.data || [];

  const handleContinue = () => {
    setItems(items);
    setStep("allocate");
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleAddItem} className="space-y-4 rounded-lg border border-slate-200 p-4">
        <div>
          <label className="block text-sm font-medium text-slate-700">Nama item</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Pizza"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Kategori</label>
            <select
              value={category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="food">Food</option>
              <option value="drink">Drink</option>
              <option value="transport">Transport</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Tipe alokasi</label>
            <select
              value={itemType}
              onChange={(e) => {
                setItemType(e.target.value);
                setTypeTouched(true);
              }}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="SHARED">SHARED</option>
              <option value="INDIVIDUAL">INDIVIDUAL</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-slate-700">Harga total (Rp)</label>
            <input
              type="number"
              min="0"
              value={totalPrice}
              onChange={(e) => setTotalPrice(e.target.value)}
              placeholder="60000"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Qty</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        </div>

        {name && totalPrice && (
          <p className="text-xs text-slate-500">
            "{name}" ({formatRupiah(totalPrice)}) {PREVIEW_TEXT[itemType]}
          </p>
        )}

        <button
          type="submit"
          disabled={addItem.isPending}
          className="w-full rounded-md bg-slate-900 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {addItem.isPending ? "Menambahkan..." : "Tambah item"}
        </button>
      </form>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-slate-700">
          Items ({items.length})
        </h3>
        {itemsQuery.isLoading && <p className="text-sm text-slate-400">Memuat...</p>}
        <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between px-4 py-3 text-sm">
              <div>
                <span className="font-medium text-slate-900">{item.name}</span>
                <span className="ml-2 rounded bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">
                  {item.itemType}
                </span>
                <span className="ml-2 text-slate-400">×{item.quantity}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-700">{formatRupiah(item.totalPrice)}</span>
                <button
                  onClick={() => deleteItem.mutate(item.id)}
                  className="text-slate-400 hover:text-red-500"
                  aria-label={`Hapus ${item.name}`}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <button
        onClick={handleContinue}
        disabled={items.length === 0}
        className="w-full rounded-md bg-slate-900 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
      >
        Lanjut ke alokasi ({items.length} item)
      </button>
    </div>
  );
}
