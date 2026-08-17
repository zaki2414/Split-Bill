import { useState } from "react";
import { Check, LogOut, Wallet } from "lucide-react";
import { useSplitStore } from "./store/splitStore";
import { useAuthStore } from "./store/authStore";
import { BTN_ICON } from "./lib/buttonStyles";
import StartStep from "./pages/StartStep";
import ItemsStep from "./pages/ItemsStep";
import AllocateStep from "./pages/AllocateStep";
import SummaryStep from "./pages/SummaryStep";
import ReportStep from "./pages/ReportStep";
import HistoryPage from "./pages/HistoryPage";
import LandingPage from "./pages/LandingPage";
import LoginScreen from "./pages/LoginScreen";
import JigsawBackground from "./components/JigsawBackground";

const STEPS = [
  { key: "start", label: "Mulai" },
  { key: "items", label: "Item" },
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

function StepProgress() {
  const step = useSplitStore((s) => s.step);
  const setStep = useSplitStore((s) => s.setStep);
  const currentIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <ol className="mt-8 flex items-center">
      {STEPS.map((s, i) => {
        const isDone = i < currentIndex;
        const isCurrent = i === currentIndex;
        const canJump = isDone; // can only jump back to an already-completed step

        return (
          <li key={s.key} className="flex flex-1 items-center last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <button
                type="button"
                onClick={() => canJump && setStep(s.key)}
                disabled={!canJump}
                aria-current={isCurrent ? "step" : undefined}
                className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold transition-colors ${
                  isDone
                    ? "cursor-pointer bg-olive text-white hover:bg-olive-dark"
                    : isCurrent
                      ? "bg-olive-dark text-white ring-4 ring-olive-light"
                      : "border-2 border-olive-light bg-white text-olive-light"
                }`}
              >
                {isDone ? <Check className="h-4 w-4" strokeWidth={3} /> : i + 1}
              </button>
              <span
                className={`text-[11px] font-bold whitespace-nowrap ${
                  i <= currentIndex ? "text-olive-dark" : "text-olive-light"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`mx-1 mb-4 h-1.5 flex-1 rounded-full transition-colors ${
                  i < currentIndex ? "bg-olive" : "bg-olive-light/50"
                }`}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}

function WizardScreen() {
  const step = useSplitStore((s) => s.step);
  const StepComponent = STEP_COMPONENTS[step];

  return (
    <>
      <StepProgress />
      <div className="mt-8">
        <StepComponent />
      </div>
    </>
  );
}

function UserBadge({ onLogout }) {
  const user = useAuthStore((s) => s.user);
  if (!user) return null;

  return (
    <div className="flex items-center gap-2 rounded-full border-2 border-olive-light bg-white py-1 pr-1 pl-3">
      <span className="hidden text-sm font-bold text-olive-dark sm:inline">{user.name}</span>
      {user.avatarUrl ? (
        <img src={user.avatarUrl} alt={user.name} className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-olive text-xs font-extrabold text-white">
          {user.name?.[0]?.toUpperCase()}
        </span>
      )}
      <button
        type="button"
        onClick={onLogout}
        aria-label="Keluar"
        className={`${BTN_ICON} h-7 w-7 text-olive-dark/50 hover:bg-cream hover:text-coral`}
      >
        <LogOut className="h-4 w-4" strokeWidth={2.5} />
      </button>
    </div>
  );
}

function App() {
  const [screen, setScreen] = useState("landing");
  const title = useSplitStore((s) => s.title);
  const resetSplit = useSplitStore((s) => s.reset);
  const isAuthenticated = useAuthStore((s) => !!s.token);
  const logout = useAuthStore((s) => s.logout);

  if (screen === "landing") {
    return <LandingPage onStart={() => setScreen("wizard")} />;
  }

  if (!isAuthenticated) {
    return <LoginScreen onBack={() => setScreen("landing")} />;
  }

  const handleLogout = () => {
    logout();
    resetSplit();
    setScreen("landing");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-cream">
      <JigsawBackground opacity={0.1} />
      <div
        className={`relative mx-auto px-4 py-10 transition-all duration-300 ${
          screen === "history" ? "max-w-4xl" : "max-w-xl"
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
          <div>
            <button
              type="button"
              onClick={() => setScreen("landing")}
              className="cursor-pointer flex items-center gap-2 text-2xl font-extrabold tracking-tight text-olive-darker transition-colors hover:text-olive sm:text-3xl"
            >
              <Wallet className="h-6 w-6 text-olive sm:h-7 sm:w-7" strokeWidth={2.5} />
              BagiRata
            </button>
            {screen === "wizard" && title && (
              <p className="mt-1 text-sm font-bold text-olive-dark">{title}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <nav className="flex gap-1 rounded-full border-2 border-olive-light bg-white p-1 text-sm">
              {NAV_ITEMS.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setScreen(item.key)}
                  className={`cursor-pointer rounded-full px-4 py-1.5 font-bold transition-colors ${
                    screen === item.key
                      ? "bg-olive text-white shadow-sm hover:bg-olive-dark"
                      : "text-olive-dark hover:bg-cream"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
            <UserBadge onLogout={handleLogout} />
          </div>
        </div>

        {screen === "wizard" && <WizardScreen />}
        {screen === "history" && (
          <div className="mt-8">
            <HistoryPage />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
