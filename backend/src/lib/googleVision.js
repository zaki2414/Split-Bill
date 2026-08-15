const VISION_API_URL = "https://vision.googleapis.com/v1/images:annotate";

export function isOcrConfigured() {
  return Boolean(process.env.GOOGLE_VISION_API_KEY);
}

// Returns the full recognized text, or null if OCR isn't configured (fallback: manual entry).
export async function detectReceiptText(imageBuffer) {
  const apiKey = process.env.GOOGLE_VISION_API_KEY;
  if (!apiKey) return null;

  const response = await fetch(`${VISION_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      requests: [
        {
          image: { content: imageBuffer.toString("base64") },
          features: [{ type: "TEXT_DETECTION" }],
          imageContext: { languageHints: ["id", "en"] },
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Vision API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  const result = data.responses?.[0];
  if (result?.error) {
    throw new Error(`Google Vision API error: ${result.error.message}`);
  }

  return result?.fullTextAnnotation?.text || "";
}
