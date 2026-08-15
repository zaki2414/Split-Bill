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
        className="w-full rounded-md border border-slate-300 py-2.5 text-sm font-medium text-slate-700"
      >
        Mulai split bill baru
      </button>
    </div>
  );
}
