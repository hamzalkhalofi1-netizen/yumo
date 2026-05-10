import { Router, type IRouter, type Request, type Response } from "express";
import * as cheerio from "cheerio";

const router: IRouter = Router();

const FETCH_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 10; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
};

const FETCH_TIMEOUT = 12000;

async function fetchHtml(url: string): Promise<string> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT);
  try {
    const res = await fetch(url, { headers: FETCH_HEADERS, signal: controller.signal, redirect: "follow" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

function resolveUrl(base: string, href: string): string {
  if (!href) return "";
  if (href.startsWith("http://") || href.startsWith("https://")) return href;
  if (href.startsWith("//")) return "https:" + href;
  try {
    return new URL(href, base).href;
  } catch {
    return href;
  }
}

function extractImageSrc($el: cheerio.Cheerio<any>, $: cheerio.CheerioAPI, base: string): string {
  const attrs = ["data-src", "data-lazy-src", "data-original", "data-url", "src"];
  for (const attr of attrs) {
    const val = $el.attr(attr) ?? $el.find("img").first().attr(attr);
    if (val && !val.startsWith("data:") && val.length > 5) {
      return resolveUrl(base, val);
    }
  }
  return "";
}

// ─── LISTING SELECTORS (tried in order) ──────────────────────────────────────
const LISTING_SELECTORS = [
  // MangaKatana-style: div.item with data-id attribute
  ".item[data-id]",
  "#hot_update .item",
  ".slick_book .item",
  // Common card-based layouts
  ".manga-list .manga-item",
  ".manga-list li",
  ".listupd .bs",
  ".listupd .bsx",
  ".series-list .series-item",
  ".comic-list .comic-item",
  ".manhwa-list .item",
  ".book-list .book-item",
  ".grid-item[class*='manga']",
  ".grid-item[class*='comic']",
  ".item-list .item",
  ".main-manga .item",
  // WordPress / CMS themes
  "article.listupd",
  ".page-listing-item",
  ".list-manga .manga-item",
  ".cat-series .item",
  ".search-wrap .bs",
  // Table/row based
  ".listing tr",
  ".table-titles tr",
  // Generic with image+link children (most specific to least)
  "li[class*='manga']",
  "li[class*='comic']",
  "li[class*='manhwa']",
  "div[class*='manga-item']",
  "div[class*='comic-item']",
];

// Title candidates in priority order (most specific first)
const TITLE_SELECTORS = [
  "h3.title a", "h2.title a", ".title a", ".series-title a",
  "h3.title", "h2.title", ".manga-name a", ".comic-name a",
  ".manga-name", ".comic-name", ".series-title",
  "[class*='title'] a", "[class*='name'] a",
  "h3 a", "h2 a", "h3", "h2", ".name a", ".name",
  "[class*='title']",
];

function extractTitle($el: cheerio.Cheerio<any>, $: cheerio.CheerioAPI): string {
  // Try each selector
  for (const ts of TITLE_SELECTORS) {
    const found = $el.find(ts).first();
    const text = found.text().trim();
    if (text && text.length > 1 && !isBracketedText(text)) return text;
    // Also check title attribute on anchors
    const attrTitle = found.attr("title")?.trim() ?? "";
    if (attrTitle && attrTitle.length > 1 && !isBracketedText(attrTitle)) return attrTitle;
  }
  // Fallback: top-level anchor title attribute
  const anchorTitle = $el.find("a").first().attr("title")?.trim() ?? "";
  if (anchorTitle && !isBracketedText(anchorTitle)) return anchorTitle;
  return "";
}

function isBracketedText(s: string): boolean {
  return /^\[.*\]$/.test(s.trim()) || /^[\[\(]/.test(s.trim());
}

const COVER_SELECTORS = [
  ".cover img", ".thumb img", ".poster img",
  "[class*='cover'] img", "[class*='thumb'] img",
  "img.img-responsive", "img.lazyload", "img",
];

// ─── DETAIL SELECTORS ─────────────────────────────────────────────────────────
const DETAIL_TITLE_SELECTORS = [
  "h1.entry-title", "h1.title", ".titlemanga", ".series-title",
  ".comic-title", "h1[itemprop='name']", ".info-title h1",
  ".post-title h1", "h1", ".name",
];

const DETAIL_COVER_SELECTORS = [
  ".thumb img", ".series-cover img", ".cover img",
  ".info-image img", ".poster img", "[class*='cover'] img",
  "[class*='thumb'] img", "img.img-responsive",
];

const DETAIL_DESC_SELECTORS = [
  ".entry-content p", ".description p", ".summary__content p",
  "[class*='desc'] p", "[class*='synopsis'] p", ".synopsis",
  ".manga-summary", ".story", "#syn-target",
];

const CHAPTER_SELECTORS = [
  // MangaKatana-style: div.chapter inside tr rows
  ".chapters tr .chapter",
  ".chapters .chapter",
  // WordPress manga themes
  "li.wp-manga-chapter", "ul.row-content-chapter li",
  // Common list patterns
  "#chapterlist li", ".chapter-list li", ".chapters li",
  "[class*='chapter-list'] li", "[class*='episode-list'] li",
  ".listing tr", ".list-chapter li", ".chapterlist li",
  "li.volume-manga", ".list-item-chapters a",
  // Table-based
  "table tr[data-jump]",
];

const CHAPTER_LINK_SELECTORS = ["a", "a.chapter-link"];
const CHAPTER_TITLE_SELECTORS = [".chapter-title", "span:first-child", "a"];

// ─── PAGE SELECTORS ──────────────────────────────────────────────────────────
const PAGE_IMG_SELECTORS = [
  "#readerarea img", ".reading-content img", ".page-break img",
  ".chapter-content img", "[class*='reader'] img",
  "[class*='page'] img", ".entry-content img",
  ".comic-page img", "img.wp-manga-chapter-img",
  "#image-container img", ".image-container img",
  "figure img", ".chapter-image img", ".mangaread img",
];

// ─── DISCOVER: scrape a listing page ─────────────────────────────────────────
router.post("/scraper/discover", async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  let baseUrl: string;
  try {
    baseUrl = new URL(url).origin;
  } catch {
    res.status(400).json({ error: "Invalid URL" });
    return;
  }

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const siteName = $("title").text().trim() || new URL(url).hostname;

    let items: any[] = [];

    for (const selector of LISTING_SELECTORS) {
      const found = $(selector);
      if (found.length >= 2) {
        found.each((_i, el) => {
          const $el = $(el);
          const title = extractTitle($el, $);
          let cover = "";
          for (const cs of COVER_SELECTORS) {
            const imgEl = $el.find(cs).first();
            cover = extractImageSrc(imgEl, $, url);
            if (cover) break;
          }
          const link = resolveUrl(url, $el.find("a").first().attr("href") ?? "");
          if (title && link) {
            items.push({ title: title.slice(0, 120), cover, link });
          }
        });
        if (items.length >= 4) break;
      }
    }

    // Fallback: extract any anchors with images (best-effort)
    if (items.length < 2) {
      $("a").each((_i, el) => {
        const $el = $(el);
        const img = $el.find("img").first();
        const cover = extractImageSrc(img, $, url);
        const imgAlt = img.attr("alt")?.trim() ?? "";
        const title =
          $el.attr("title")?.trim() ||
          $el.find("[class*='title'], [class*='name'], h3, h2").first().text().trim() ||
          (!isBracketedText(imgAlt) ? imgAlt : "");
        const link = resolveUrl(url, $el.attr("href") ?? "");
        if (title && cover && link && link !== url && !isBracketedText(title)) {
          items.push({ title: title.slice(0, 120), cover, link });
        }
      });
    }

    // Deduplicate by link
    const seen = new Set<string>();
    items = items.filter((item) => {
      if (seen.has(item.link)) return false;
      seen.add(item.link);
      return true;
    }).slice(0, 40);

    res.json({
      siteName,
      sourceUrl: url,
      baseUrl,
      manhwa: items,
      total: items.length,
    });
  } catch (err: any) {
    req.log.error({ err, url }, "Scraper discover failed");
    res.status(502).json({ error: `Failed to scrape: ${err.message ?? "Unknown error"}` });
  }
});

// ─── MANHWA: scrape a detail/series page ─────────────────────────────────────
router.post("/scraper/manhwa", async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);

    let title = "";
    for (const sel of DETAIL_TITLE_SELECTORS) {
      title = $(sel).first().text().trim();
      if (title) break;
    }
    if (!title) title = $("title").text().trim();

    let cover = "";
    for (const sel of DETAIL_COVER_SELECTORS) {
      const el = $(sel).first();
      cover = extractImageSrc(el, $, url);
      if (cover) break;
    }

    let description = "";
    for (const sel of DETAIL_DESC_SELECTORS) {
      description = $(sel).first().text().trim();
      if (description.length > 20) break;
    }

    // Extract genre/tags
    const genres: string[] = [];
    $("[class*='genre'] a, [class*='tag'] a, [class*='category'] a").each((_i, el) => {
      const g = $(el).text().trim();
      if (g && g.length < 30) genres.push(g);
    });

    // Extract chapters
    const chapters: any[] = [];
    for (const sel of CHAPTER_SELECTORS) {
      const found = $(sel);
      if (found.length >= 1) {
        found.each((idx, el) => {
          const $el = $(el);
          let chLink = "";
          for (const ls of CHAPTER_LINK_SELECTORS) {
            chLink = resolveUrl(url, $el.find(ls).first().attr("href") ?? "");
            if (chLink) break;
          }
          let chTitle = "";
          for (const ts of CHAPTER_TITLE_SELECTORS) {
            chTitle = $el.find(ts).first().text().trim();
            if (chTitle) break;
          }
          const dateText = $el.find("[class*='date'], time").first().text().trim();
          const match = chTitle.match(/(\d+(\.\d+)?)/);
          const chNumber = match ? parseFloat(match[1]) : found.length - idx;
          if (chLink) {
            chapters.push({
              id: chLink,
              number: chNumber,
              title: chTitle || `Chapter ${chNumber}`,
              date: dateText || "",
              link: chLink,
              pages: 0,
              isNew: idx < 3,
            });
          }
        });
        if (chapters.length > 0) break;
      }
    }

    res.json({
      manhwa: {
        id: url,
        title: title.slice(0, 200),
        cover,
        description: description.slice(0, 1000),
        genre: genres.slice(0, 6),
        chapters: chapters.slice(0, 300),
        sourceUrl: url,
        author: "Unknown",
        artist: "Unknown",
        rating: 0,
        views: "",
        status: "Ongoing",
        year: new Date().getFullYear(),
        tags: [],
      },
    });
  } catch (err: any) {
    req.log.error({ err, url }, "Scraper manhwa failed");
    res.status(502).json({ error: `Failed to scrape: ${err.message ?? "Unknown error"}` });
  }
});

// ─── CHAPTER: scrape a chapter page for images ───────────────────────────────
router.post("/scraper/chapter", async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }

  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const pages: { url: string }[] = [];
    const seen = new Set<string>();

    const addPage = (src: string) => {
      if (src && !seen.has(src) && !src.endsWith(".gif") && !src.includes("logo") && !src.includes("fav")) {
        seen.add(src);
        pages.push({ url: src });
      }
    };

    // ── Strategy 1: Extract from inline JS variable arrays (MangaKatana style) ──
    const scriptContent = $("script").map((_i, el) => $(el).html() ?? "").get().join("\n");
    const jsArrayPatterns = [
      /var\s+(?:thzq|pages|images|imageList|pageList|imgList)\s*=\s*\[([^\]]+)\]/,
      /\bimages\s*[:=]\s*\[([^\]]+)\]/,
      /\bpages\s*[:=]\s*\[([^\]]+)\]/,
    ];
    for (const pattern of jsArrayPatterns) {
      const match = scriptContent.match(pattern);
      if (match?.[1]) {
        const urlMatches = match[1].matchAll(/'(https?:[^']+\.(?:jpg|jpeg|png|webp)[^']*)'/gi);
        for (const m of urlMatches) addPage(m[1]);
        if (pages.length > 2) break;
      }
    }

    // ── Strategy 2: Regex scan entire HTML for image URLs ──────────────────────
    if (pages.length < 3) {
      const allUrls = html.matchAll(/https?:\/\/[^\s'"]+\.(?:jpg|jpeg|png|webp)(?:[?#][^\s'"]*)?/gi);
      for (const m of allUrls) {
        const src = m[0].replace(/['"\\]+$/, "");
        if (/\/(0|[1-9]\d*)\.(jpg|jpeg|png|webp)/i.test(src) || /chapter|page|img|scan/i.test(src)) {
          addPage(src);
        }
      }
    }

    // ── Strategy 3: Standard CSS selector extraction ───────────────────────────
    if (pages.length < 3) {
      for (const sel of PAGE_IMG_SELECTORS) {
        $(sel).each((_i, el) => {
          const src = extractImageSrc($(el), $, url);
          if (src) addPage(src);
        });
        if (pages.length >= 3) break;
      }
    }

    // ── Strategy 4: Any img with manga-like filename or large dimensions ────────
    if (pages.length < 3) {
      $("img").each((_i, el) => {
        const $img = $(el);
        const src = extractImageSrc($img, $, url);
        const w = parseInt($img.attr("width") ?? "0");
        const h = parseInt($img.attr("height") ?? "0");
        const isMangaLike = /\d{2,}\.(?:jpg|jpeg|png|webp)/i.test(src) || w > 300 || h > 400;
        if (src && isMangaLike) addPage(src);
      });
    }

    res.json({ pages, total: pages.length });
  } catch (err: any) {
    req.log.error({ err, url }, "Scraper chapter failed");
    res.status(502).json({ error: `Failed to scrape: ${err.message ?? "Unknown error"}` });
  }
});

// ─── TEST: quick health-check of a domain ────────────────────────────────────
router.post("/scraper/test", async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };
  if (!url) {
    res.status(400).json({ error: "url is required" });
    return;
  }
  try {
    const html = await fetchHtml(url);
    const $ = cheerio.load(html);
    const title = $("title").text().trim();
    const imgCount = $("img").length;
    const linkCount = $("a").length;
    res.json({
      reachable: true,
      title,
      imgCount,
      linkCount,
      hint: imgCount > 10 && linkCount > 20
        ? "Site appears content-rich — scraping likely to find results."
        : "Site reachable but may have limited scrapeable content.",
    });
  } catch (err: any) {
    res.json({ reachable: false, error: err.message ?? "Unreachable" });
  }
});

export default router;
