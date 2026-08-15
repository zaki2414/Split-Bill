import "dotenv/config";
import express from "express";
import cors from "cors";
import { receiptsRouter } from "./routes/receipts.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" })); // allow base64 receipt images later

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/receipts", receiptsRouter);

app.listen(PORT, () => {
  console.log(`Split Bill API listening on http://localhost:${PORT}`);
});
