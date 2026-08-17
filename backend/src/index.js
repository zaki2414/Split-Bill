import "dotenv/config";
import path from "node:path";
import express from "express";
import cors from "cors";
import { authRouter } from "./routes/auth.js";
import { receiptsRouter } from "./routes/receipts.js";
import { itemsRouter } from "./routes/items.js";
import { allocationsRouter } from "./routes/allocations.js";
import { settlementsRouter } from "./routes/settlements.js";
import { receiptImageRouter } from "./routes/receiptImage.js";
import { requireAuth } from "./middleware/auth.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow base64 receipt images later
app.use("/uploads", express.static(path.join(import.meta.dirname, "..", "uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/receipts", requireAuth, receiptsRouter);
app.use("/api/receipts/:receiptId/items", requireAuth, itemsRouter);
app.use("/api/receipts/:receiptId/image", requireAuth, receiptImageRouter);
app.use("/api/allocations", requireAuth, allocationsRouter);
app.use("/api/settlements", requireAuth, settlementsRouter);

app.listen(PORT, () => {
  console.log(`BagiRata API listening on http://localhost:${PORT}`);
});
