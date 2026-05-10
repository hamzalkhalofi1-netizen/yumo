import { Router, type IRouter, type Request, type Response } from "express";
import { GoogleGenerativeAI, type Part } from "@google/generative-ai";

const router: IRouter = Router();

function getGemini() {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) throw new Error("GEMINI_API_KEY is not set in environment");
  return new GoogleGenerativeAI(key);
}

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  Accept: "image/webp,image/apng,image/*,*/*;q=0.8",
  Referer: "https://mangakatana.com/",
};

const TRANSLATE_PROMPT = `You are an expert manga/manhwa translator specializing in Korean to French translation.

Examine this manhwa page image carefully.

1. Identify ALL speech bubbles, thought bubbles, text boxes, narration boxes, sound effects, and any other text in the image.
2. Extract the Korean text from each one.
3. Translate each text naturally and fluently into French, preserving the tone, emotion, and style.
4. Format your response as a numbered list, one entry per speech bubble/text element.
5. If sound effects (onomatopoeia) are present, include them too (translated or transliterated).
6. If there is no Korean text at all, respond only with: "Aucun texte détecté sur cette page."
7. Do NOT include commentary, explanations, or the original Korean text — only the French translations.

Example output:
1. "Pourquoi es-tu ici ?"
2. "Je... je ne sais pas."
3. *BANG* — BOUM !`;

async function fetchImageAsBase64(imageUrl: string): Promise<{ data: string; mimeType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const res = await fetch(imageUrl, {
      headers: FETCH_HEADERS,
      signal: controller.signal,
      redirect: "follow",
    });
    if (!res.ok) throw new Error(`Image fetch failed: HTTP ${res.status}`);
    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    const mimeType = contentType.split(";")[0].trim();
    const buffer = await res.arrayBuffer();
    const data = Buffer.from(buffer).toString("base64");
    return { data, mimeType };
  } finally {
    clearTimeout(timer);
  }
}

// ─── POST /api/translate/page ─────────────────────────────────────────────────
// Translates a single manga page image from Korean to a target language
router.post("/translate/page", async (req: Request, res: Response) => {
  const { imageUrl, targetLang = "French" } = req.body as {
    imageUrl?: string;
    targetLang?: string;
  };

  if (!imageUrl) {
    res.status(400).json({ error: "imageUrl is required" });
    return;
  }

  try {
    const { data, mimeType } = await fetchImageAsBase64(imageUrl);

    const genai = getGemini();
    const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt =
      targetLang === "French"
        ? TRANSLATE_PROMPT
        : TRANSLATE_PROMPT.replace(/French/g, targetLang).replace(/Aucun texte détecté sur cette page\./g, `No text detected on this page.`);

    const imagePart: Part = {
      inlineData: { data, mimeType },
    };

    const result = await model.generateContent([prompt, imagePart]);
    const translation = result.response.text().trim();

    res.json({ translation, targetLang });
  } catch (err: any) {
    req.log.error({ err, imageUrl }, "Translation failed");

    if (err.message?.includes("GEMINI_API_KEY")) {
      res.status(500).json({ error: "Clé API non configurée sur le serveur." });
      return;
    }
    if (err.message?.includes("leaked") || err.message?.includes("PERMISSION_DENIED") || err.message?.includes("403")) {
      res.status(403).json({ error: "Clé API invalide ou révoquée. Veuillez générer une nouvelle clé sur aistudio.google.com." });
      return;
    }
    if (err.message?.includes("Image fetch")) {
      res.status(502).json({ error: `Impossible de récupérer l'image: ${err.message}` });
      return;
    }
    res.status(500).json({ error: err.message ?? "Translation failed" });
  }
});

// ─── POST /api/translate/batch ────────────────────────────────────────────────
// Translate multiple pages, returns array of translations (SSE-style progress)
router.post("/translate/batch", async (req: Request, res: Response) => {
  const { imageUrls, targetLang = "French" } = req.body as {
    imageUrls?: string[];
    targetLang?: string;
  };

  if (!imageUrls || !Array.isArray(imageUrls) || imageUrls.length === 0) {
    res.status(400).json({ error: "imageUrls array is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const sendEvent = (data: object) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  let genai: GoogleGenerativeAI;
  try {
    genai = getGemini();
  } catch (err: any) {
    sendEvent({ error: err.message, done: true });
    res.end();
    return;
  }

  const model = genai.getGenerativeModel({ model: "gemini-1.5-flash" });
  const results: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      const { data, mimeType } = await fetchImageAsBase64(url!);
      const imagePart: Part = { inlineData: { data, mimeType } };
      const result = await model.generateContent([TRANSLATE_PROMPT, imagePart]);
      const translation = result.response.text().trim();
      results.push(translation);
      sendEvent({ index: i, translation, total: imageUrls.length });
    } catch (err: any) {
      const fallback = "Traduction indisponible pour cette page.";
      results.push(fallback);
      sendEvent({ index: i, translation: fallback, error: err.message, total: imageUrls.length });
    }
    // small delay to avoid rate limits
    if (i < imageUrls.length - 1) await new Promise((r) => setTimeout(r, 300));
  }

  sendEvent({ done: true, results });
  res.end();
});

// ─── GET /api/translate/status ───────────────────────────────────────────────
// Performs a live validation of the API key (not just presence check)
router.get("/translate/status", async (_req: Request, res: Response) => {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) {
    res.json({ ready: false, reason: "GEMINI_API_KEY not configured" });
    return;
  }

  try {
    // Quick probe to verify the key is valid and not revoked
    const probe = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${key}&pageSize=1`
    );
    const body = (await probe.json()) as { error?: { message: string; code: number } };

    if (body.error) {
      res.json({ ready: false, reason: body.error.message, code: body.error.code });
      return;
    }

    res.json({
      ready: true,
      model: "gemini-1.5-flash",
      capabilities: ["vision-ocr", "korean-to-french", "multi-language"],
    });
  } catch (err: any) {
    res.json({ ready: false, reason: err.message ?? "Network error" });
  }
});

export default router;
