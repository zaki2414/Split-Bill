import { Wallet } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t-2 border-olive-dark/20 bg-olive-dark px-6 py-8 text-center">
      <p className="flex items-center justify-center gap-2 text-sm font-bold text-cream/80">
        <Wallet className="h-4 w-4" strokeWidth={2.5} />
        BagiRata — Solusi pembagian tagihan yang mudah dan akurat.
      </p>
    </footer>
  );
}
