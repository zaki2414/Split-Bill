import { useState } from "react";
import { useSplitStore } from "./store/splitStore";
import StartStep from "./pages/StartStep";
import ItemsStep from "./pages/ItemsStep";
import AllocateStep from "./pages/AllocateStep";
import SummaryStep from "./pages/SummaryStep";
import ReportStep from "./pages/ReportStep";
import HistoryPage from "./pages/HistoryPage";

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

const NAV_ITEMS = [
  { key: "wizard", label: "Split" },
  { key: "history", label: "Riwayat" },
];

function WizardScreen() {
  const step = useSplitStore((s) => s.step);
  const currentIndex = STEPS.findIndex((s) => s.key === step);
  const StepComponent = STEP_COMPONENTS[step];

  return (
    <>
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
    </>
  );
}

function App() {
  const [screen, setScreen] = useState("wizard");
  const title = useSplitStore((s) => s.title);

  return (
    <div className="mx-auto max-w-xl px-4 py-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Split Bill</h1>
          {screen === "wizard" && title && <p className="mt-1 text-sm text-slate-500">{title}</p>}
        </div>
        <nav className="flex gap-1 rounded-md bg-slate-100 p-1 text-sm">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setScreen(item.key)}
              className={`rounded px-3 py-1.5 font-medium ${
                screen === item.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {screen === "wizard" && <WizardScreen />}
      {screen === "history" && (
        <div className="mt-8">
          <HistoryPage />
        </div>
      )}
    </div>
  );
}

export default App;
