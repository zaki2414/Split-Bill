import { ListChecks, Calculator, Camera, ClipboardList } from "lucide-react";
import JigsawBackground from "./JigsawBackground";

const FEATURES = [
  {
    icon: ListChecks,
    title: "Alokasi Berbasis Item",
    desc: "Tandai peserta untuk setiap item secara langsung, tanpa perlu drag-and-drop.",
  },
  {
    icon: Calculator,
    title: "Perhitungan Pajak yang Adil",
    desc: "Biaya layanan dan pajak dibagi secara proporsional berdasarkan porsi konsumsi setiap peserta, bukan dibagi rata.",
  },
  {
    icon: Camera,
    title: "Pemindaian Struk Otomatis",
    desc: "Unggah foto struk, dan item-item di dalamnya akan diekstrak secara otomatis.",
  },
  {
    icon: ClipboardList,
    title: "Hasil Siap Dibagikan",
    desc: "Dapatkan ringkasan dalam format teks yang siap disalin dan dibagikan ke grup percakapan.",
  },
];

export default function WhySplitBill() {
  return (
    <section className="relative overflow-hidden bg-white py-20">
      <JigsawBackground opacity={0.06} />
      <div className="relative mx-auto max-w-4xl px-6">
        <h2 className="text-center text-2xl font-extrabold text-olive-darker sm:text-3xl">
          Mengapa Menggunakan BagiRata?
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {FEATURES.map((feature) => (
            <div key={feature.title} className="flex gap-4 rounded-3xl bg-cream p-6">
              <feature.icon className="h-8 w-8 shrink-0 text-olive" strokeWidth={2.25} />
              <div>
                <h3 className="text-base font-extrabold text-olive-darker">{feature.title}</h3>
                <p className="mt-1 text-sm font-medium text-olive-dark/70">{feature.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
