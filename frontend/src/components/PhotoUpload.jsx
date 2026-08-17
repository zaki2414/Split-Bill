import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { api } from "../lib/api";

const LABEL = "flex items-center gap-1.5 text-sm font-bold text-olive-dark";
const HINT = "mt-1 text-xs font-medium text-olive-dark/60";
const BTN_PRIMARY =
  "rounded-full bg-olive px-6 py-3 text-sm font-extrabold text-white shadow-md shadow-olive/30 transition active:scale-[0.98] disabled:opacity-40 disabled:shadow-none hover:bg-olive/80";
const BTN_SECONDARY =
  "rounded-full border-2 border-olive-light bg-white px-6 py-3 text-sm font-extrabold text-olive-dark transition hover:bg-cream active:scale-[0.98]";

// Shared upload+OCR panel. Used both when a receipt is first created and as a
// standalone "re-upload / ganti foto struk" action from later steps. Extracted
// items from a re-upload are added to the existing item list, not replacing it.
export default function PhotoUpload({
  receiptId,
  onDone,
  onCancel,
  cancelLabel = "Lewati",
  submitLabel = "Lanjutkan ke Daftar Item",
  hint,
}) {
  const [imageFiles, setImageFiles] = useState([]);

  const uploadImage = useMutation({
    mutationFn: (files) => {
      const formData = new FormData();
      for (const file of files) formData.append("images", file);
      return api
        .post(`/api/receipts/${receiptId}/image`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        })
        .then((res) => res.data);
    },
    onSuccess: async (data) => {
      if (data.extracted_items?.length > 0) {
        await Promise.all(
          data.extracted_items.map((item) => api.post(`/api/receipts/${receiptId}/items`, item))
        );
      }
      onDone(data);
    },
  });

  return (
    <div className="space-y-6 rounded-3xl border-2 border-olive-light/60 bg-white p-6 shadow-sm">
      <div>
        <label className={LABEL}>
          <Camera className="h-4 w-4" strokeWidth={2.5} />
          Foto Struk (Opsional)
        </label>
        <p className={HINT}>
          {hint ||
            "Bisa unggah lebih dari satu foto jika struk terpotong menjadi beberapa bagian - hasil OCR-nya akan digabung secara otomatis. Foto akan dikompresi secara otomatis, dan item pada struk akan diekstrak secara otomatis serta tetap dapat dikoreksi pada tahap berikutnya."}
        </p>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => setImageFiles([...e.target.files])}
          className="mt-3 block w-full cursor-pointer text-sm font-medium text-olive-darker file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-olive-light file:px-4 file:py-2 file:text-sm file:font-bold file:text-olive-darker"
        />
        {imageFiles.length > 1 && (
          <p className="mt-2 text-xs font-bold text-olive-dark">{imageFiles.length} foto dipilih</p>
        )}
      </div>

      {uploadImage.isError && (
        <p className="text-sm font-bold text-coral">
          Gagal mengunggah foto. Silakan coba lagi atau lewati langkah ini.
        </p>
      )}

      <div className="flex gap-3">
        <button type="button" onClick={onCancel} className={`flex-1 cursor-pointer ${BTN_SECONDARY}`}>
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={() => (imageFiles.length > 0 ? uploadImage.mutate(imageFiles) : onCancel())}
          disabled={uploadImage.isPending}
          className={`flex-1 cursor-pointer ${BTN_PRIMARY}`}
        >
          {uploadImage.isPending ? "Mengunggah..." : submitLabel}
        </button>
      </div>
    </div>
  );
}
