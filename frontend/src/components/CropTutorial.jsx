// A small looping animation showing how the crop box works: drag its corner handle
// to resize the selection over the receipt. Purely illustrative, no interaction.
export default function CropTutorial() {
  return (
    <div className="flex items-center gap-4 rounded-2xl border-2 border-olive-light/60 bg-cream/60 p-4">
      <svg viewBox="0 0 120 90" className="h-20 w-28 shrink-0" aria-hidden="true">
        <rect x="10" y="6" width="70" height="78" rx="4" fill="white" stroke="#c6d870" strokeWidth="2" />
        <rect x="18" y="16" width="40" height="4" rx="2" fill="#c6d870" />
        <rect x="18" y="26" width="54" height="3" rx="1.5" fill="#e4edb8" />
        <rect x="18" y="34" width="54" height="3" rx="1.5" fill="#e4edb8" />
        <rect x="18" y="42" width="54" height="3" rx="1.5" fill="#e4edb8" />
        <rect x="18" y="50" width="30" height="3" rx="1.5" fill="#e4edb8" />
        <rect x="18" y="60" width="36" height="4" rx="2" fill="#8fa31e" />

        <rect
          className="crop-tutorial-box"
          x="14"
          y="22"
          width="52"
          height="34"
          fill="rgba(143,163,30,0.12)"
          stroke="#556b2f"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
        <circle className="crop-tutorial-handle" cx="66" cy="56" r="5" fill="#556b2f" />
      </svg>
      <p className="text-xs font-medium text-olive-dark/80">
        <span className="font-extrabold text-olive-darker">Tips:</span> geser sudut kotak putus-putus untuk
        menyesuaikan area struk, lalu tekan "Gunakan Bagian Ini".
      </p>
    </div>
  );
}
