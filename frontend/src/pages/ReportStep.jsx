import { RotateCcw } from "lucide-react";
import { useSplitStore } from "../store/splitStore";
import SettlementReport from "./SettlementReport";

export default function ReportStep() {
  const receiptId = useSplitStore((s) => s.receiptId);
  const reset = useSplitStore((s) => s.reset);

  return (
    <div className="space-y-6">
      <SettlementReport receiptId={receiptId} />

      <button
        type="button"
        onClick={reset}
        className="cursor-pointer flex w-full items-center justify-center gap-1.5 rounded-full border-2 border-olive-light bg-white py-3 text-sm font-extrabold text-olive-dark transition hover:bg-cream active:scale-[0.98]"
      >
        <RotateCcw className="h-4 w-4" strokeWidth={2.5} />
        Mulai BagiRata Baru
      </button>
    </div>
  );
}
