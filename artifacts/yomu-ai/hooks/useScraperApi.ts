import { useMutation, useQuery } from "@tanstack/react-query";

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

async function apiPost<T>(path: string, body: object): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json() as any;
  if (!res.ok) throw new Error(data.error ?? `API error ${res.status}`);
  return data as T;
}

export interface ScrapedManhwaItem {
  title: string;
  cover: string;
  link: string;
}

export interface DiscoverResult {
  siteName: string;
  sourceUrl: string;
  baseUrl: string;
  manhwa: ScrapedManhwaItem[];
  total: number;
}

export interface ScrapedChapter {
  id: string;
  number: number;
  title: string;
  date: string;
  link: string;
  pages: number;
  isNew?: boolean;
}

export interface ScrapedManhwa {
  id: string;
  title: string;
  cover: string;
  description: string;
  genre: string[];
  chapters: ScrapedChapter[];
  sourceUrl: string;
  author: string;
  artist: string;
  rating: number;
  views: string;
  status: string;
  year: number;
  tags: string[];
}

export interface ScrapedPage {
  url: string;
}

export interface TestResult {
  reachable: boolean;
  title?: string;
  imgCount?: number;
  linkCount?: number;
  hint?: string;
  error?: string;
}

export function useDiscoverSource(url: string, enabled: boolean) {
  return useQuery({
    queryKey: ["scraper", "discover", url],
    queryFn: () => apiPost<DiscoverResult>("/scraper/discover", { url }),
    enabled: enabled && url.length > 0,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
}

export function useScrapeManhwa(manhwaUrl: string, enabled: boolean) {
  return useQuery({
    queryKey: ["scraper", "manhwa", manhwaUrl],
    queryFn: () => apiPost<{ manhwa: ScrapedManhwa }>("/scraper/manhwa", { url: manhwaUrl }),
    enabled: enabled && manhwaUrl.length > 0,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
}

export function useScrapeChapter(chapterUrl: string, enabled: boolean) {
  return useQuery({
    queryKey: ["scraper", "chapter", chapterUrl],
    queryFn: () => apiPost<{ pages: ScrapedPage[]; total: number }>("/scraper/chapter", { url: chapterUrl }),
    enabled: enabled && chapterUrl.length > 0,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

export function useTestSource() {
  return useMutation({
    mutationFn: (url: string) => apiPost<TestResult>("/scraper/test", { url }),
  });
}

export function useDiscoverMutation() {
  return useMutation({
    mutationFn: (url: string) => apiPost<DiscoverResult>("/scraper/discover", { url }),
  });
}
