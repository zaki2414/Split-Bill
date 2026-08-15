import "dotenv/config";
import express from "express";
import cors from "cors";
import { receiptsRouter } from "./routes/receipts.js";
import { itemsRouter } from "./routes/items.js";
import { allocationsRouter } from "./routes/allocations.js";
import { settlementsRouter } from "./routes/settlements.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow base64 receipt images later

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/receipts", receiptsRouter);
app.use("/api/receipts/:receiptId/items", itemsRouter);
app.use("/api/allocations", allocationsRouter);
app.use("/api/settlements", settlementsRouter);

app.listen(PORT, () => {
  console.log(`Split Bill API listening on http://localhost:${PORT}`);
});
