import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AITranslationModal } from "@/components/AITranslationModal";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { useScrapeManhwa, type ScrapedChapter } from "@/hooks/useScraperApi";

export default function ScraperDetailScreen() {
  const { url, title: paramTitle } = useLocalSearchParams<{ url: string; title: string }>();
  const colors = useColors();
  const { addToHistory, canUseAI, user } = useApp();

  const { data, isLoading, isError, error, refetch } = useScrapeManhwa(url, true);
  const manhwa = data?.manhwa;

  const [expanded, setExpanded] = useState(false);
  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<ScrapedChapter | null>(null);

  const displayTitle = manhwa?.title || paramTitle || "Loading...";

  const handleReadChapter = (chapter: ScrapedChapter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (manhwa) {
      addToHistory({
        manhwaId: url,
        manhwaTitle: displayTitle,
        cover: manhwa.cover,
        chapterNumber: chapter.number,
        chapterTitle: chapter.title,
        readAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      });
    }
    router.push({ pathname: "/scraper-reader", params: { chapterUrl: chapter.link, title: chapter.title } });
  };

  const handleAITranslate = (chapter: ScrapedChapter) => {
    setSelectedChapter(chapter);
    setAiModalVisible(true);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
          Scraping manhwa details...
        </Text>
      </View>
    );
  }

  if (isError || !manhwa) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={52} color={colors.mutedForeground} />
        <Text style={[styles.errorTitle, { color: colors.foreground }]}>Failed to Load</Text>
        <Text style={[styles.errorDesc, { color: colors.mutedForeground }]}>
          {(error as Error)?.message ?? "Could not scrape this manhwa page."}
        </Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.muted }]} onPress={() => router.back()}>
            <Text style={[styles.btnText, { color: colors.foreground }]}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={[styles.btnText, { color: "#fff" }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const desc = manhwa.description ?? "";
  const descPreview = desc.slice(0, 150) + (desc.length > 150 ? "..." : "");

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={[styles.backHeader]}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: "rgba(0,0,0,0.6)" }]}
            onPress={() => router.back()}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: "rgba(0,0,0,0.6)" }]}
            onPress={() => router.push({ pathname: "/sources" })}
          >
            <MaterialCommunityIcons name="web" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={[styles.hero, { backgroundColor: "#1a0a0a" }]}>
          {manhwa.cover ? (
            <Image
              source={{ uri: manhwa.cover }}
              style={[StyleSheet.absoluteFill, { opacity: 0.65 }]}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.heroOverlay} />
        </View>

        <View style={[styles.info, { backgroundColor: colors.background }]}>
          <View style={[styles.scraperBadge, { backgroundColor: colors.muted }]}>
            <MaterialCommunityIcons name="spider-web" size={12} color={colors.primary} />
            <Text style={[styles.scraperBadgeText, { color: colors.primary }]}>Dynamically Scraped</Text>
          </View>

          <Text style={[styles.title, { color: colors.foreground }]}>{displayTitle}</Text>

          <View style={styles.metaRow}>
            {manhwa.author !== "Unknown" && (
              <Text style={[styles.meta, { color: colors.mutedForeground }]}>{manhwa.author}</Text>
            )}
            <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.statusText}>{manhwa.status}</Text>
            </View>
          </View>

          {manhwa.genre.length > 0 && (
            <View style={styles.genres}>
              {manhwa.genre.map((g) => (
                <View key={g} style={[styles.genreTag, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.genreText, { color: colors.mutedForeground }]}>{g}</Text>
                </View>
              ))}
            </View>
          )}

          {desc.length > 0 && (
            <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
              <Text style={[styles.description, { color: colors.foreground }]}>
                {expanded ? desc : descPreview}
              </Text>
              {desc.length > 150 && (
                <Text style={[styles.seeMore, { color: colors.primary }]}>
                  {expanded ? "Show less" : "Read more"}
                </Text>
              )}
            </TouchableOpacity>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.chapterHeader, { color: colors.foreground }]}>
            Chapters ({manhwa.chapters.length})
          </Text>
        </View>

        {manhwa.chapters.length === 0 ? (
          <View style={styles.noChapters}>
            <MaterialCommunityIcons name="book-off-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.noChaptersText, { color: colors.mutedForeground }]}>
              No chapters detected on this page
            </Text>
          </View>
        ) : (
          manhwa.chapters.map((chapter) => (
            <View
              key={chapter.id}
              style={[styles.chapterRow, { borderBottomColor: colors.border, backgroundColor: colors.background }]}
            >
              <View style={styles.chapterLeft}>
                {chapter.isNew && (
                  <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.newBadgeText}>NEW</Text>
                  </View>
                )}
                <Text style={[styles.chapterTitle, { color: colors.foreground }]}>{chapter.title}</Text>
                {chapter.date ? (
                  <Text style={[styles.chapterMeta, { color: colors.mutedForeground }]}>{chapter.date}</Text>
                ) : null}
              </View>
              <View style={styles.chapterActions}>
                <TouchableOpacity
                  style={[styles.aiBtn, { backgroundColor: colors.muted, borderColor: colors.primary }]}
                  onPress={() => handleAITranslate(chapter)}
                >
                  <MaterialCommunityIcons name="translate" size={14} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.readBtn, { backgroundColor: colors.primary }]}
                  onPress={() => handleReadChapter(chapter)}
                >
                  <MaterialCommunityIcons name="book-open-variant" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {selectedChapter && (
        <AITranslationModal
          visible={aiModalVisible}
          onClose={() => { setAiModalVisible(false); setSelectedChapter(null); }}
          chapterTitle={selectedChapter.title}
          totalPages={Math.max(selectedChapter.pages, 20)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  loadingText: { fontSize: 15, fontFamily: "Inter_500Medium" },
  errorTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  errorDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  errorActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: { paddingVertical: 11, paddingHorizontal: 24, borderRadius: 10 },
  btnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  backHeader: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8,
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  hero: { height: 240, position: "relative" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  info: { padding: 20, gap: 12 },
  scraperBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  scraperBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", lineHeight: 28 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  meta: { fontSize: 13, fontFamily: "Inter_400Regular" },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { color: "#fff", fontSize: 11, fontFamily: "Inter_600SemiBold" },
  genres: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  genreTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  genreText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  seeMore: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  divider: { height: 0.5, marginVertical: 4 },
  chapterHeader: { fontSize: 17, fontFamily: "Inter_700Bold" },
  noChapters: { alignItems: "center", padding: 32, gap: 10 },
  noChaptersText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  chapterRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 13, paddingHorizontal: 20, borderBottomWidth: 0.5,
  },
  chapterLeft: { flex: 1, gap: 4 },
  newBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: "flex-start" },
  newBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  chapterTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  chapterMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  chapterActions: { flexDirection: "row", gap: 8 },
  aiBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  readBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
