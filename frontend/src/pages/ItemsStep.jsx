import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Car, CupSoda, Package, Pencil, User, Users, Utensils } from "lucide-react";
import { api } from "../lib/api";
import { useSplitStore } from "../store/splitStore";
import { CATEGORY_LABEL, ITEM_TYPE_LABEL } from "../lib/labels";
import PhotoUpload from "../components/PhotoUpload";

const CATEGORY_ICON = {
  food: Utensils,
  drink: CupSoda,
  transport: Car,
  other: Package,
};

const ITEM_TYPE_ICON = {
  SHARED: Users,
  INDIVIDUAL: User,
};

// Transport is a flat shared cost (e.g. one ojek fare for the group), not something
// ordered per-unit-per-person, so it defaults to SHARED while food/drink/other - which
// people order individually - default to INDIVIDUAL.
const CATEGORY_DEFAULT_TYPE = {
  food: "INDIVIDUAL",
  drink: "INDIVIDUAL",
  transport: "SHARED",
  other: "INDIVIDUAL",
};

const PREVIEW_TEXT = {
  SHARED: "akan dibagi rata kepada seluruh peserta yang mengonsumsinya",
  INDIVIDUAL: "akan dihitung per orang sesuai jumlah yang dipesan",
};

const formatRupiah = (n) =>
  `Rp${Math.round(Number(n)).toLocaleString("id-ID")}`;

const LABEL = "block text-sm font-bold text-olive-dark";
const INPUT =
  "mt-1 w-full rounded-2xl border-2 border-olive-light bg-white px-4 py-2.5 text-sm font-medium text-olive-darker placeholder:text-olive-dark/30 focus:border-olive focus:outline-none focus:ring-4 focus:ring-olive/20";
const BTN_PRIMARY =
  "cursor-pointer rounded-full bg-olive px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-olive/30 transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none hover:bg-olive/80";
const BTN_SECONDARY =
  "cursor-pointer rounded-full border-2 border-olive-light bg-white px-6 py-3 text-sm font-extrabold text-olive-dark transition hover:bg-cream active:scale-[0.98]";

const EMPTY_FORM = {
  name: "",
  category: "food",
  totalPrice: "",
  quantity: "1",
};

export default function ItemsStep() {
  const receiptId = useSplitStore((s) => s.receiptId);
  const setStep = useSplitStore((s) => s.setStep);
  const setItems = useSplitStore((s) => s.setItems);
  const queryClient = useQueryClient();

  const [editingItemId, setEditingItemId] = useState(null);
  const [name, setName] = useState(EMPTY_FORM.name);
  const [category, setCategory] = useState(EMPTY_FORM.category);
  const [totalPrice, setTotalPrice] = useState(EMPTY_FORM.totalPrice);
  const [quantity, setQuantity] = useState(EMPTY_FORM.quantity);
  const [itemType, setItemType] = useState(CATEGORY_DEFAULT_TYPE.food);
  const [typeTouched, setTypeTouched] = useState(false);
  const [showPhotoUpload, setShowPhotoUpload] = useState(false);

  const itemsQuery = useQuery({
    queryKey: ["items", receiptId],
    queryFn: () =>
      api.get(`/api/receipts/${receiptId}/items`).then((res) => res.data),
    enabled: !!receiptId,
  });

  const resetForm = () => {
    setName(EMPTY_FORM.name);
    setTotalPrice(EMPTY_FORM.totalPrice);
    setQuantity(EMPTY_FORM.quantity);
    setCategory(EMPTY_FORM.category);
    setTypeTouched(false);
    setItemType(CATEGORY_DEFAULT_TYPE[EMPTY_FORM.category]);
    setEditingItemId(null);
  };

  const addItem = useMutation({
    mutationFn: (payload) =>
      api
        .post(`/api/receipts/${receiptId}/items`, payload)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", receiptId] });
      resetForm();
    },
  });

  const updateItem = useMutation({
    mutationFn: (payload) =>
      api
        .put(`/api/receipts/${receiptId}/items/${editingItemId}`, payload)
        .then((res) => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", receiptId] });
      resetForm();
    },
  });

  const deleteItem = useMutation({
    mutationFn: (itemId) =>
      api.delete(`/api/receipts/${receiptId}/items/${itemId}`),
    onSuccess: (_, itemId) => {
      queryClient.invalidateQueries({ queryKey: ["items", receiptId] });
      if (itemId === editingItemId) resetForm();
    },
  });

  const handleCategoryChange = (value) => {
    setCategory(value);
    if (!typeTouched) setItemType(CATEGORY_DEFAULT_TYPE[value]);
  };

  const startEdit = (item) => {
    setEditingItemId(item.id);
    setName(item.name);
    setCategory(item.category || "food");
    setTotalPrice(String(item.totalPrice));
    setQuantity(String(item.quantity));
    setItemType(item.itemType);
    setTypeTouched(true);
    setShowPhotoUpload(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !totalPrice || !quantity) return;
    const payload = {
      name,
      category,
      totalPrice: Number(totalPrice),
      quantity: Number(quantity),
      itemType,
    };
    if (editingItemId) updateItem.mutate(payload);
    else addItem.mutate(payload);
  };

  const items = itemsQuery.data || [];
  const isEditing = !!editingItemId;
  const isSaving = addItem.isPending || updateItem.isPending;

  const handleContinue = () => {
    setItems(items);
    setStep("allocate");
  };

  return (
    <div className="space-y-6">
      {showPhotoUpload ? (
        <PhotoUpload
          receiptId={receiptId}
          cancelLabel="Batal"
          submitLabel="Unggah & Tambahkan"
          hint="Unggah foto struk baru untuk menambah item secara otomatis lewat OCR - item yang sudah ada di daftar tidak akan terhapus. Hasil ekstraksi tetap bisa dikoreksi lewat tombol edit di daftar item."
          onCancel={() => setShowPhotoUpload(false)}
          onDone={() => {
            queryClient.invalidateQueries({ queryKey: ["items", receiptId] });
            setShowPhotoUpload(false);
          }}
        />
      ) : (
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-3xl border-2 border-olive-light/60 bg-white p-6 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-extrabold text-olive-dark">
              {isEditing ? "Edit Item" : "Tambah Item Manual"}
            </h2>
            {!isEditing && (
              <button
                type="button"
                onClick={() => setShowPhotoUpload(true)}
                className="flex cursor-pointer items-center gap-1 text-xs font-extrabold text-olive underline decoration-olive-light decoration-2 underline-offset-2"
              >
                <Camera className="h-3.5 w-3.5" strokeWidth={2.5} />
                Upload / Ganti Foto Struk
              </button>
            )}
          </div>

          <div>
            <label className={LABEL}>Nama Item</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Pizza"
              className={INPUT}
            />
          </div>

          <div>
            <label className={LABEL}>Kategori</label>
            <div className="mt-1 grid grid-cols-4 gap-2">
              {Object.entries(CATEGORY_LABEL).map(([value, label]) => {
                const Icon = CATEGORY_ICON[value];
                const selected = category === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleCategoryChange(value)}
                    aria-pressed={selected}
                    className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition ${
                      selected ? "border-olive bg-olive/10" : "border-olive-light bg-white hover:bg-cream"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${selected ? "text-olive" : "text-olive-dark/50"}`}
                      strokeWidth={2.5}
                    />
                    <span className="text-xs font-bold text-olive-darker">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className={LABEL}>Tipe Alokasi</label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {Object.entries(ITEM_TYPE_LABEL).map(([value, label]) => {
                const Icon = ITEM_TYPE_ICON[value];
                const selected = itemType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => {
                      setItemType(value);
                      setTypeTouched(true);
                    }}
                    aria-pressed={selected}
                    className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-2xl border-2 p-3 text-center transition ${
                      selected ? "border-olive bg-olive/10" : "border-olive-light bg-white hover:bg-cream"
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 ${selected ? "text-olive" : "text-olive-dark/50"}`}
                      strokeWidth={2.5}
                    />
                    <span className="text-xs font-bold text-olive-darker">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Harga Total (Rp)</label>
              <input
                type="number"
                min="0"
                value={totalPrice}
                onChange={(e) => setTotalPrice(e.target.value)}
                placeholder="60000"
                className={INPUT}
              />
            </div>
            <div>
              <label className={LABEL}>Jumlah</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className={INPUT}
              />
            </div>
          </div>

          {name && totalPrice && (
            <p className="rounded-2xl bg-cream px-4 py-2.5 text-xs font-bold text-olive-dark">
              "{name}" ({formatRupiah(totalPrice)}) {PREVIEW_TEXT[itemType]}.
            </p>
          )}

          <div className="flex gap-3">
            {isEditing && (
              <button
                type="button"
                onClick={resetForm}
                className={`flex-1 cursor-pointer ${BTN_SECONDARY}`}
              >
                Batal
              </button>
            )}
            <button
              type="submit"
              disabled={isSaving}
              className={`flex-1 cursor-pointer ${BTN_PRIMARY}`}
            >
              {isSaving
                ? "Menyimpan..."
                : isEditing
                  ? "Simpan Perubahan"
                  : "+ Tambah Item"}
            </button>
          </div>
        </form>
      )}

      <div>
        <h3 className="mb-2 text-sm font-extrabold text-olive-dark">
          Daftar Item ({items.length})
        </h3>
        {itemsQuery.isLoading && (
          <p className="text-sm font-medium text-olive-dark/60">Memuat...</p>
        )}
        <ul className="divide-y-2 divide-cream overflow-hidden rounded-3xl border-2 border-olive-light/60 bg-white">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center justify-between px-5 py-3.5 text-sm transition ${
                item.id === editingItemId ? "bg-olive/10" : ""
              }`}
            >
              <div>
                <span className="font-bold text-olive-darker">{item.name}</span>
                <span className="ml-2 rounded-full bg-olive-light/50 px-2 py-0.5 text-xs font-bold text-olive-darker">
                  {ITEM_TYPE_LABEL[item.itemType] || item.itemType}
                </span>
                <span className="ml-2 font-medium text-olive-dark/50">
                  ×{item.quantity}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-olive-dark">
                  {formatRupiah(item.totalPrice)}
                </span>
                <button
                  onClick={() => startEdit(item)}
                  className="cursor-pointer text-olive-dark/40 hover:text-olive"
                  aria-label={`Edit ${item.name}`}
                >
                  <Pencil className="h-4 w-4" strokeWidth={2.5} />
                </button>
                <button
                  onClick={() => deleteItem.mutate(item.id)}
                  className="cursor-pointer text-olive-dark/40 hover:text-coral"
                  aria-label={`Hapus ${item.name}`}
                >
                  ×
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => setStep("start")}
          className={`flex-1 cursor-pointer ${BTN_SECONDARY}`}
        >
          Kembali
        </button>
        <button
          onClick={handleContinue}
          disabled={items.length === 0}
          className={`flex-1 ${BTN_PRIMARY}`}
        >
          Lanjutkan ke Alokasi ({items.length} Item)
        </button>
      </div>
    </div>
  );
}
