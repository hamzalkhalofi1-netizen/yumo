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

const PROMPTS: Record<string, string> = {
  Arabic: `أنت مترجم محترف للمانهوا والمانغا متخصص في الترجمة من الكورية إلى العربية.

افحص صورة هذه الصفحة بعناية.

1. حدد جميع فقاعات الحوار، فقاعات التفكير، صناديق النص، صناديق السرد، المؤثرات الصوتية، وأي نص آخر في الصورة.
2. استخرج النص الكوري من كل منها.
3. ترجم كل نص بشكل طبيعي وسلس إلى العربية، مع الحفاظ على النبرة والعاطفة والأسلوب.
4. نسّق إجابتك كقائمة مرقمة، إدخال واحد لكل فقاعة/عنصر نص.
5. إذا كانت هناك مؤثرات صوتية (محاكاة صوتية)، قم بتضمينها أيضاً (مترجمة أو منقحة).
6. إذا لم يكن هناك نص كوري على الإطلاق، أجب فقط بـ: "لا يوجد نص في هذه الصفحة."
7. لا تدرج تعليقات أو تفسيرات أو النص الكوري الأصلي — فقط الترجمات العربية.

مثال على المخرجات:
1. "لماذا أنت هنا؟"
2. "أنا... لا أعرف."
3. *بووم!*`,

  French: `You are an expert manga/manhwa translator specializing in Korean to French translation.

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
3. *BANG* — BOUM !`,

  English: `You are an expert manga/manhwa translator specializing in Korean to English translation.

Examine this manhwa page image carefully.

1. Identify ALL speech bubbles, thought bubbles, text boxes, narration boxes, sound effects, and any other text in the image.
2. Extract the Korean text from each one.
3. Translate each text naturally and fluently into English, preserving the tone, emotion, and style.
4. Format your response as a numbered list, one entry per speech bubble/text element.
5. If sound effects (onomatopoeia) are present, include them too (translated or adapted).
6. If there is no Korean text at all, respond only with: "No text detected on this page."
7. Do NOT include commentary, explanations, or the original Korean text — only the English translations.

Example output:
1. "Why are you here?"
2. "I... I don't know."
3. *BANG!*`,
};

function getPrompt(targetLang: string): string {
  return PROMPTS[targetLang] ?? PROMPTS["Arabic"]!;
}

const NO_TEXT_MSGS: Record<string, string> = {
  Arabic: "لا يوجد نص في هذه الصفحة.",
  French: "Aucun texte détecté sur cette page.",
  English: "No text detected on this page.",
};

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
router.post("/translate/page", async (req: Request, res: Response) => {
  const { imageUrl, targetLang = "Arabic" } = req.body as {
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
    const imagePart: Part = { inlineData: { data, mimeType } };

    const result = await model.generateContent([getPrompt(targetLang), imagePart]);
    const translation = result.response.text().trim() || (NO_TEXT_MSGS[targetLang] ?? NO_TEXT_MSGS["Arabic"]!);

    res.json({ translation, targetLang });
  } catch (err: any) {
    req.log.error({ err, imageUrl }, "Translation failed");

    if (err.message?.includes("GEMINI_API_KEY")) {
      res.status(500).json({ error: "Clé API non configurée sur le serveur." });
      return;
    }
    if (err.message?.includes("leaked") || err.message?.includes("PERMISSION_DENIED") || err.message?.includes("403")) {
      res.status(403).json({ error: "مفتاح API غير صالح أو ملغى. يرجى إنشاء مفتاح جديد." });
      return;
    }
    if (err.message?.includes("Image fetch")) {
      res.status(502).json({ error: `تعذّر جلب الصورة: ${err.message}` });
      return;
    }
    res.status(500).json({ error: err.message ?? "Translation failed" });
  }
});

// ─── POST /api/translate/batch ────────────────────────────────────────────────
router.post("/translate/batch", async (req: Request, res: Response) => {
  const { imageUrls, targetLang = "Arabic" } = req.body as {
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
  const prompt = getPrompt(targetLang);
  const fallbackMsg = NO_TEXT_MSGS[targetLang] ?? NO_TEXT_MSGS["Arabic"]!;
  const results: string[] = [];

  for (let i = 0; i < imageUrls.length; i++) {
    const url = imageUrls[i];
    try {
      const { data, mimeType } = await fetchImageAsBase64(url!);
      const imagePart: Part = { inlineData: { data, mimeType } };
      const result = await model.generateContent([prompt, imagePart]);
      const translation = result.response.text().trim() || fallbackMsg;
      results.push(translation);
      sendEvent({ index: i, translation, total: imageUrls.length });
    } catch (err: any) {
      results.push(fallbackMsg);
      sendEvent({ index: i, translation: fallbackMsg, error: err.message, total: imageUrls.length });
    }
    if (i < imageUrls.length - 1) await new Promise((r) => setTimeout(r, 300));
  }

  sendEvent({ done: true, results });
  res.end();
});

// ─── GET /api/translate/status ───────────────────────────────────────────────
router.get("/translate/status", async (_req: Request, res: Response) => {
  const key = process.env["GEMINI_API_KEY"];
  if (!key) {
    res.json({ ready: false, reason: "GEMINI_API_KEY not configured" });
    return;
  }

  try {
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
      languages: ["Arabic", "English", "French"],
      defaultLang: "Arabic",
    });
  } catch (err: any) {
    res.json({ ready: false, reason: err.message ?? "Network error" });
  }
});

export default router;
