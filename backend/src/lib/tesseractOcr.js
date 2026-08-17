import { createWorker } from "tesseract.js";

// Runs fully locally (WASM) - no API key, no billing account, no external service.
// The worker is expensive to spin up (loads language data), so one shared instance is
// reused across requests instead of creating a new one per upload.
let workerPromise = null;

function getWorker() {
  if (!workerPromise) {
    workerPromise = createWorker(["ind", "eng"]);
  }
  return workerPromise;
}

export function isOcrConfigured() {
  return true;
}

export async function detectReceiptText(imageBuffer) {
  const worker = await getWorker();
  const {
    data: { text },
  } = await worker.recognize(imageBuffer);
  return text;
}
