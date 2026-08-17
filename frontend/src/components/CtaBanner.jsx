import { ArrowRight } from "lucide-react";

export default function CtaBanner({ onStart }) {
  return (
    <section className="bg-olive-dark px-6 py-20 text-center">
      <h2 className="text-2xl font-extrabold text-cream sm:text-3xl">
        Mulai BagiRata Pertama Anda Sekarang
      </h2>
      <p className="mx-auto mt-3 max-w-md text-sm font-medium text-cream/70">
        Gratis, tanpa perlu menginstal aplikasi.
      </p>
      <button
        type="button"
        onClick={onStart}
        className="mx-auto mt-7 flex cursor-pointer items-center justify-center gap-2 rounded-full bg-olive px-8 py-4 text-base font-extrabold text-white shadow-lg shadow-black/20 transition hover:bg-olive/80 active:scale-[0.98]"
      >
        Mulai BagiRata
        <ArrowRight className="h-5 w-5" strokeWidth={2.5} />
      </button>
    </section>
  );
}
