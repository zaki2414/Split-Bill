import "dotenv/config";
// Express 4 doesn't forward errors thrown inside async route handlers to error
// middleware on its own - an unhandled rejection there just hangs the request (or
// crashes the process). This patches Express to catch and forward them properly,
// so the error handler below actually gets a chance to respond.
import "express-async-errors";
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

// Catches anything a route handler threw (including Prisma errors) so it becomes a
// clean JSON response instead of a hung request or a leaked stack trace.
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`BagiRata API listening on http://localhost:${PORT}`);
});
