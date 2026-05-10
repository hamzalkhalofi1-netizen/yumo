import { useQuery } from "@tanstack/react-query";

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}/api${path}`);
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export interface ApiManhwa {
  id: string;
  title: string;
  cover: string;
  author: string;
  artist: string;
  genre: string[];
  rating: number;
  views: string;
  status: "Ongoing" | "Completed" | "Hiatus";
  description: string;
  year: number;
  tags: string[];
  chapters: ApiChapter[];
}

export interface ApiChapter {
  id: string;
  number: number;
  title: string;
  date: string;
  pages: number;
  isNew?: boolean;
}

export function useManhwaList(page = 1, sort = "followedCount") {
  return useQuery({
    queryKey: ["manhwa", "list", page, sort],
    queryFn: () =>
      apiFetch<{ manhwa: ApiManhwa[]; total: number }>(
        `/manhwa?page=${page}&limit=20&sort=${sort}`
      ),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useManhwaSearch(q: string, genre: string) {
  return useQuery({
    queryKey: ["manhwa", "search", q, genre],
    queryFn: () =>
      apiFetch<{ manhwa: ApiManhwa[]; total: number }>(
        `/manhwa/search?q=${encodeURIComponent(q)}&genre=${encodeURIComponent(genre)}`
      ),
    enabled: q.length > 0 || genre !== "All",
    staleTime: 3 * 60 * 1000,
    retry: 1,
  });
}

export function useManhwaDetail(id: string) {
  return useQuery({
    queryKey: ["manhwa", "detail", id],
    queryFn: () => apiFetch<{ manhwa: ApiManhwa }>(`/manhwa/${id}`),
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

export function useManhwaChapters(manhwaId: string) {
  return useQuery({
    queryKey: ["manhwa", "chapters", manhwaId],
    queryFn: () =>
      apiFetch<{ chapters: ApiChapter[]; total: number }>(
        `/manhwa/${manhwaId}/chapters`
      ),
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

export function useChapterPages(chapterId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["chapter", "pages", chapterId],
    queryFn: () =>
      apiFetch<{ pages: { url: string }[]; total: number }>(
        `/chapter/${chapterId}/pages`
      ),
    enabled,
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
}
