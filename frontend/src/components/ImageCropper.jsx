import { useEffect, useRef, useState } from "react";
import ReactCrop from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { BTN_PRIMARY, BTN_SECONDARY } from "../lib/buttonStyles";
import CropTutorial from "./CropTutorial";

const DEFAULT_CROP = { unit: "%", x: 5, y: 10, width: 90, height: 80 };

// Crop, then export the selected region at the image's native resolution (not its
// on-screen display size) so the uploaded photo stays sharp regardless of how small
// the crop preview renders on a phone screen.
function cropToFile(img, crop, fileName) {
  const scaleX = img.naturalWidth / img.width;
  const scaleY = img.naturalHeight / img.height;
  const px = {
    x: (crop.unit === "%" ? (crop.x / 100) * img.width : crop.x) * scaleX,
    y: (crop.unit === "%" ? (crop.y / 100) * img.height : crop.y) * scaleY,
    width: (crop.unit === "%" ? (crop.width / 100) * img.width : crop.width) * scaleX,
    height: (crop.unit === "%" ? (crop.height / 100) * img.height : crop.height) * scaleY,
  };

  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(px.width));
  canvas.height = Math.max(1, Math.round(px.height));
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, px.x, px.y, px.width, px.height, 0, 0, canvas.width, canvas.height);

  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => resolve(new File([blob], fileName, { type: "image/jpeg" })),
      "image/jpeg",
      0.92,
    );
  });
}

// One photo at a time: shows it with a draggable/resizable crop box so the user can
// trim the shot down to just the receipt (cutting out background, table, hands, etc.)
// before it gets uploaded and OCR'd.
export default function ImageCropper({ file, label, onConfirm, onSkip }) {
  const [crop, setCrop] = useState(DEFAULT_CROP);
  const [completedCrop, setCompletedCrop] = useState(DEFAULT_CROP);
  const [isCropping, setIsCropping] = useState(false);
  const [src, setSrc] = useState(null);
  const imgRef = useRef(null);

  // Create/revoke the object URL together inside one effect (keyed on `file`) rather
  // than at ref-init time - React StrictMode double-invokes effects in dev, and a
  // ref-based create-once/cleanup-once pairing gets its URL revoked by the first
  // (throwaway) cleanup pass, leaving the <img> pointed at a dead blob URL.
  useEffect(() => {
    const url = URL.createObjectURL(file);
    setSrc(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const handleConfirm = async () => {
    const img = imgRef.current;
    const c = completedCrop;
    if (!img || !c?.width || !c?.height) {
      onSkip();
      return;
    }
    setIsCropping(true);
    const cropped = await cropToFile(img, c, file.name);
    setIsCropping(false);
    onConfirm(cropped);
  };

  return (
    <div className="space-y-4">
      <CropTutorial />
      {label && <p className="text-xs font-bold text-olive-dark/70">{label}</p>}
      <div className="flex justify-center overflow-hidden rounded-2xl border-2 border-olive-light bg-olive-darker/90 p-2">
        {src && (
          <ReactCrop crop={crop} onChange={(c) => setCrop(c)} onComplete={(c) => setCompletedCrop(c)}>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <img ref={imgRef} src={src} alt="Struk" className="max-h-[55vh] w-auto" />
          </ReactCrop>
        )}
      </div>
      <div className="flex gap-3">
        <button type="button" onClick={onSkip} className={`flex-1 cursor-pointer ${BTN_SECONDARY}`}>
          Lewati Crop
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={isCropping}
          className={`flex-1 cursor-pointer ${BTN_PRIMARY}`}
        >
          {isCropping ? "Memproses..." : "Gunakan Bagian Ini"}
        </button>
      </div>
    </div>
  );
}
