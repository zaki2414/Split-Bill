import { useSplitStore } from "./store/splitStore";
import StartStep from "./pages/StartStep";
import ItemsStep from "./pages/ItemsStep";
import AllocateStep from "./pages/AllocateStep";
import SummaryStep from "./pages/SummaryStep";
import ReportStep from "./pages/ReportStep";

const STEPS = [
  { key: "start", label: "Mulai" },
  { key: "items", label: "Items" },
  { key: "allocate", label: "Alokasi" },
  { key: "summary", label: "Ringkasan" },
  { key: "report", label: "Laporan" },
];

const STEP_COMPONENTS = {
  start: StartStep,
  items: ItemsStep,
  allocate: AllocateStep,
  summary: SummaryStep,
  report: ReportStep,
};

function App() {
  const step = useSplitStore((s) => s.step);
  const title = useSplitStore((s) => s.title);
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const StepComponent = STEP_COMPONENTS[step];

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <h1 className="text-2xl font-semibold text-slate-900">Split Bill</h1>
      {title && <p className="mt-1 text-sm text-slate-500">{title}</p>}

      <ol className="mt-6 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s.key} className="flex items-center gap-2">
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                i <= currentIndex ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-500"
              }`}
            >
              {i + 1}
            </span>
            <span className={`text-xs ${i <= currentIndex ? "text-slate-900" : "text-slate-400"}`}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="mx-1 h-px w-4 bg-slate-200" />}
          </li>
        ))}
      </ol>

      <div className="mt-8">
        <StepComponent />
      </div>
    </div>
  );
}

export default App;
