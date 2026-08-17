import { ArrowRight } from "lucide-react";
import JigsawBackground from "./JigsawBackground";

export default function Hero({ onStart }) {
  return (
    <section className="relative flex min-h-[calc(100vh-88px)] flex-col items-center justify-center overflow-hidden px-6 text-center">
      <JigsawBackground />
      <div className="relative mx-auto max-w-2xl">
        <h1 className="text-4xl leading-tight font-extrabold text-olive-darker sm:text-5xl">
          Bagi tagihan bersama teman, <span className="text-olive">secara akurat</span>.
        </h1>
        <p className="mt-5 text-lg font-medium text-olive-dark">
          Masukkan tagihan, alokasikan pesanan setiap peserta, dan dapatkan rincian pembagian
          pembayaran secara instan.
        </p>
        <button
          type="button"
          onClick={onStart}
          className="mt-8 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-olive px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-olive/30 transition active:scale-[0.98] mx-auto"
        >
          Mulai BagiRata
          <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
        </button>
      </div>
    </section>
  );
}
