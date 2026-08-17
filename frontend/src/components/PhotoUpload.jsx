import { useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Camera, Image, X } from "lucide-react";
import { api } from "../lib/api";
import { BTN_PRIMARY, BTN_SECONDARY } from "../lib/buttonStyles";
import ImageCropper from "./ImageCropper";

const LABEL = "flex items-center gap-1.5 text-sm font-bold text-olive-dark";
const HINT = "mt-1 text-xs font-medium text-olive-dark/60";

// Shared upload+OCR panel. Used both when a receipt is first created and as a
// standalone "re-upload / ganti foto struk" action from later steps. Extracted
// items from a re-upload are added to the existing item list, not replacing it.
//
// Flow: pick photo(s) (camera or gallery) -> crop each one down to just the receipt
// (trims background/table/hands, which also helps OCR) -> confirm & upload.
export default function PhotoUpload({
  receiptId,
  onDone,
  onCancel,
  cancelLabel = "Lewati",
  submitLabel = "Lanjutkan ke Daftar Item",
  hint,
}) {
  const [stage, setStage] = useState("select"); // select | crop | ready
  const [rawFiles, setRawFiles] = useState([]);
  const [cropIndex, setCropIndex] = useState(0);
  const [imageFiles, setImageFiles] = useState([]); // cropped (or skipped-original) files, ready to upload
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

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

  const addFiles = (fileList) => {
    setRawFiles((prev) => [...prev, ...fileList]);
  };

  const removeRawFile = (index) => {
    setRawFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const startCropping = () => {
    setCropIndex(0);
    setImageFiles([]);
    setStage("crop");
  };

  const advanceCrop = (processedFile) => {
    setImageFiles((prev) => [...prev, processedFile]);
    if (cropIndex + 1 < rawFiles.length) {
      setCropIndex((i) => i + 1);
    } else {
      setStage("ready");
    }
  };

  const resetAll = () => {
    setStage("select");
    setRawFiles([]);
    setImageFiles([]);
    setCropIndex(0);
  };

  if (stage === "crop" && rawFiles[cropIndex]) {
    return (
      <div className="space-y-4 rounded-3xl border-2 border-olive-light/60 bg-white p-6 shadow-sm">
        <p className="text-xs font-extrabold tracking-wide text-olive-dark/60 uppercase">
          Crop Foto {cropIndex + 1} dari {rawFiles.length}
        </p>
        <ImageCropper
          key={cropIndex}
          file={rawFiles[cropIndex]}
          onConfirm={advanceCrop}
          onSkip={() => advanceCrop(rawFiles[cropIndex])}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 rounded-3xl border-2 border-olive-light/60 bg-white p-6 shadow-sm">
      <div>
        <label className={LABEL}>
          <Camera className="h-4 w-4" strokeWidth={2.5} />
          Foto Struk (Opsional)
        </label>
        <p className={HINT}>
          {hint ||
            "Bisa unggah lebih dari satu foto jika struk terpotong menjadi beberapa bagian - hasil OCR-nya akan digabung secara otomatis. Setiap foto bisa di-crop dulu supaya hanya bagian struknya saja yang diunggah, lalu item pada struk akan diekstrak secara otomatis dan tetap dapat dikoreksi pada tahap berikutnya."}
        </p>

        {stage === "select" && (
          <>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 ${BTN_SECONDARY}`}
              >
                <Camera className="h-4 w-4" strokeWidth={2.5} />
                Ambil Foto
              </button>
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 ${BTN_SECONDARY}`}
              >
                <Image className="h-4 w-4" strokeWidth={2.5} />
                Pilih dari Galeri
              </button>
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => {
                  addFiles([...e.target.files]);
                  e.target.value = "";
                }}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  addFiles([...e.target.files]);
                  e.target.value = "";
                }}
              />
            </div>

            {rawFiles.length > 0 && (
              <ul className="mt-3 space-y-1.5">
                {rawFiles.map((file, i) => (
                  <li
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between rounded-xl bg-cream px-3 py-2 text-xs font-bold text-olive-dark"
                  >
                    <span className="truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => removeRawFile(i)}
                      aria-label={`Hapus ${file.name}`}
                      className="cursor-pointer text-olive-dark/50 hover:text-coral"
                    >
                      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {stage === "ready" && (
          <p className="mt-3 text-xs font-bold text-olive-dark">
            {imageFiles.length} foto siap diunggah.{" "}
            <button type="button" onClick={resetAll} className="cursor-pointer text-olive underline">
              Ulangi
            </button>
          </p>
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
        {stage === "select" ? (
          <button
            type="button"
            onClick={() => (rawFiles.length > 0 ? startCropping() : onCancel())}
            className={`flex-1 cursor-pointer ${BTN_PRIMARY}`}
          >
            {rawFiles.length > 0 ? "Lanjutkan ke Crop" : submitLabel}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => uploadImage.mutate(imageFiles)}
            disabled={uploadImage.isPending}
            className={`flex-1 cursor-pointer ${BTN_PRIMARY}`}
          >
            {uploadImage.isPending ? "Mengunggah..." : submitLabel}
          </button>
        )}
      </div>
    </div>
  );
}
