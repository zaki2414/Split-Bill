import { Wallet } from "lucide-react";

export default function Navbar({ onStart }) {
  return (
    <div className="sticky top-4 z-50 px-4">
      <nav className="mx-auto flex max-w-5xl items-center justify-between rounded-full bg-olive-darker px-6 py-4 shadow-lg shadow-black/10">
        <span className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-cream">
          <Wallet className="h-6 w-6 text-olive" strokeWidth={2.5} />
          BagiRata
        </span>
        <button
          type="button"
          onClick={onStart}
          className="cursor-pointer rounded-full bg-olive px-5 py-2.5 text-sm font-extrabold text-white shadow-md shadow-olive/30 transition active:scale-[0.98]"
        >
          Mulai
        </button>
      </nav>
    </div>
  );
}
