import { Receipt, CheckCircle2, MessageSquareText } from "lucide-react";

const STEPS = [
  {
    icon: Receipt,
    title: "Isi Tagihan",
    desc: "Masukkan total tagihan, nama pembayar, dan daftar peserta yang terlibat.",
  },
  {
    icon: CheckCircle2,
    title: "Alokasikan Item",
    desc: "Tandai peserta yang memesan setiap item pada struk, satu per satu.",
  },
  {
    icon: MessageSquareText,
    title: "Dapatkan Hasilnya",
    desc: "Peroleh rincian pembagian pembayaran secara otomatis dan siap dibagikan.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20">
      <h2 className="text-center text-2xl font-extrabold text-olive-darker sm:text-3xl">
        Cara Kerja
      </h2>
      <div className="mt-10 grid gap-6 sm:grid-cols-3">
        {STEPS.map((step) => (
          <div
            key={step.title}
            className="rounded-3xl border-2 border-olive-light/60 bg-white p-6 text-center shadow-sm"
          >
            <step.icon className="mx-auto h-9 w-9 text-olive" strokeWidth={2.25} />
            <h3 className="mt-3 text-lg font-extrabold text-olive-darker">{step.title}</h3>
            <p className="mt-2 text-sm font-medium text-olive-dark/70">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
