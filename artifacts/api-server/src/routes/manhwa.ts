import { Router, type IRouter, type Request, type Response } from "express";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const MANGADEX_BASE = "https://api.mangadex.org";
const COVER_BASE = "https://uploads.mangadex.org/covers";

const DEFAULT_INCLUDES = ["cover_art", "author", "artist"];
const DEFAULT_LANG = ["en"];
const MANHWA_LANG = ["ko"];

// Simple in-memory cache (TTL: 10 min)
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL = 10 * 60 * 1000;

async function mdFetch(path: string): Promise<unknown> {
  const cached = cache.get(path);
  if (cached && cached.expires > Date.now()) return cached.data;

  const res = await fetch(`${MANGADEX_BASE}${path}`, {
    headers: { "User-Agent": "YomuAI/1.0" },
  });

  if (!res.ok) {
    throw new Error(`MangaDex error ${res.status}: ${path}`);
  }

  const data = await res.json();
  cache.set(path, { data, expires: Date.now() + CACHE_TTL });
  return data;
}

function getCoverUrl(mangaId: string, relationships: any[]): string {
  const cover = relationships?.find((r: any) => r.type === "cover_art");
  if (!cover?.attributes?.fileName) return "";
  return `${COVER_BASE}/${mangaId}/${cover.attributes.fileName}.512.jpg`;
}

function getAuthor(relationships: any[], type: "author" | "artist"): string {
  const rel = relationships?.find((r: any) => r.type === type);
  return rel?.attributes?.name ?? "Unknown";
}

function getLocalised(obj: Record<string, string> | undefined, langs = ["en", "ko"]): string {
  if (!obj) return "";
  for (const lang of langs) {
    if (obj[lang]) return obj[lang];
  }
  return Object.values(obj)[0] ?? "";
}

function formatManga(item: any) {
  const attr = item.attributes ?? {};
  const rels = item.relationships ?? [];
  return {
    id: item.id,
    title: getLocalised(attr.title),
    cover: getCoverUrl(item.id, rels),
    author: getAuthor(rels, "author"),
    artist: getAuthor(rels, "artist"),
    genre: (attr.tags ?? [])
      .filter((t: any) => t.attributes?.group === "genre")
      .map((t: any) => getLocalised(t.attributes?.name))
      .slice(0, 4),
    rating: parseFloat((7 + Math.random() * 3).toFixed(1)),
    views: `${Math.floor(Math.random() * 100 + 10)}M`,
    status: attr.status === "completed" ? "Completed" : attr.status === "hiatus" ? "Hiatus" : "Ongoing",
    description: getLocalised(attr.description),
    year: attr.year ?? 2020,
    tags: (attr.tags ?? [])
      .filter((t: any) => t.attributes?.group === "theme")
      .map((t: any) => getLocalised(t.attributes?.name))
      .slice(0, 6),
    chapters: [],
  };
}

// GET /api/manhwa?page=1&limit=20&sort=followedCount
router.get("/manhwa", async (req: Request, res: Response) => {
  try {
    const limit = Math.min(Number(req.query["limit"] ?? 20), 40);
    const offset = (Number(req.query["page"] ?? 1) - 1) * limit;
    const sort = (req.query["sort"] as string) ?? "followedCount";

    const params = new URLSearchParams({
      limit: String(limit),
      offset: String(offset),
      "originalLanguage[]": MANHWA_LANG[0],
      [`order[${sort}]`]: "desc",
      "contentRating[]": "safe",
    });
    DEFAULT_INCLUDES.forEach((i) => params.append("includes[]", i));

    const data: any = await mdFetch(`/manga?${params}`);
    const manhwa = (data.data ?? []).map(formatManga);

    res.json({ manhwa, total: data.total ?? manhwa.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch manhwa list");
    res.status(502).json({ error: "Failed to fetch manhwa data" });
  }
});

// GET /api/manhwa/search?q=title&genre=Action
router.get("/manhwa/search", async (req: Request, res: Response) => {
  try {
    const q = (req.query["q"] as string) ?? "";
    const genre = req.query["genre"] as string | undefined;

    const params = new URLSearchParams({
      limit: "20",
      "originalLanguage[]": MANHWA_LANG[0],
      "contentRating[]": "safe",
    });
    if (q) params.set("title", q);
    DEFAULT_INCLUDES.forEach((i) => params.append("includes[]", i));

    const data: any = await mdFetch(`/manga?${params}`);
    let manhwa = (data.data ?? []).map(formatManga);

    if (genre && genre !== "All") {
      manhwa = manhwa.filter((m: any) =>
        m.genre.some((g: string) => g.toLowerCase().includes(genre.toLowerCase()))
      );
    }

    res.json({ manhwa, total: manhwa.length });
  } catch (err) {
    req.log.error({ err }, "Failed to search manhwa");
    res.status(502).json({ error: "Search failed" });
  }
});

// GET /api/manhwa/:id
router.get("/manhwa/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const params = new URLSearchParams();
    DEFAULT_INCLUDES.forEach((i) => params.append("includes[]", i));

    const data: any = await mdFetch(`/manga/${id}?${params}`);
    const manhwa = formatManga(data.data);

    res.json({ manhwa });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch manhwa detail");
    res.status(502).json({ error: "Failed to fetch manhwa" });
  }
});

// GET /api/manhwa/:id/chapters?limit=100
router.get("/manhwa/:id/chapters", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const limit = Math.min(Number(req.query["limit"] ?? 100), 500);

    const params = new URLSearchParams({
      limit: String(limit),
      "order[chapter]": "desc",
      "contentRating[]": "safe",
    });
    DEFAULT_LANG.forEach((l) => params.append("translatedLanguage[]", l));
    params.set("manga", String(id));

    const data: any = await mdFetch(`/chapter?${params}`);
    const chapters = (data.data ?? []).map((c: any, idx: number) => {
      const attr = c.attributes ?? {};
      return {
        id: c.id,
        number: parseFloat(attr.chapter ?? String(data.data.length - idx)),
        title: attr.title ? `Ch.${attr.chapter} - ${attr.title}` : `Chapter ${attr.chapter ?? idx + 1}`,
        date: attr.readableAt
          ? new Date(attr.readableAt).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })
          : "Unknown date",
        pages: attr.pages ?? 25,
        isNew: idx < 3,
      };
    });

    res.json({ chapters, total: data.total ?? chapters.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch chapters");
    res.status(502).json({ error: "Failed to fetch chapters" });
  }
});

// GET /api/chapter/:chapterId/pages
router.get("/chapter/:chapterId/pages", async (req: Request, res: Response) => {
  try {
    const { chapterId } = req.params;
    const server: any = await mdFetch(`/at-home/server/${chapterId}`);

    const base = server.baseUrl;
    const hash = server.chapter?.hash;
    const dataSaver = server.chapter?.dataSaver ?? [];

    const pages = dataSaver.map((filename: string) => ({
      url: `${base}/data-saver/${hash}/${filename}`,
    }));

    res.json({ pages, total: pages.length });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch chapter pages");
    res.status(502).json({ error: "Failed to fetch pages" });
  }
});

export default router;
