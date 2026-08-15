# Split Bill

Web app untuk membagi pengeluaran grup: scan struk (OCR), alokasi item per-item ("siapa aja yang makan ini?"), dan kalkulasi settlement otomatis.

Lihat [SPLIT_BILL_PROJECT_SPEC.txt](./SPLIT_BILL_PROJECT_SPEC.txt) untuk spesifikasi lengkap (schema, API, rationale, roadmap).

## Struktur

```
backend/    Node.js + Express + Prisma (PostgreSQL)
frontend/   React + Vite + Tailwind + React Query + Zustand
```

## Menjalankan secara lokal

### Prasyarat
- Node.js 18+
- PostgreSQL (lokal via Docker, atau instance cloud seperti Railway)

### Backend
```bash
cd backend
cp .env.example .env   # isi DATABASE_URL
npm install
npx prisma migrate dev # buat tabel dari prisma/schema.prisma
npm run dev             # http://localhost:3001
```

### Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev              # http://localhost:5173
```

## Status

Skeleton awal: struktur project, schema database (Prisma, sesuai spec), Express API dasar (health check + CRUD receipt minimal), React app dasar yang terhubung ke backend.

Belum diimplementasi: OCR (Google Vision), item-first allocation form, settlement calculation, history/balance tracking. Lihat spec untuk urutan phase.
