import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { AITranslationModal } from "@/components/AITranslationModal";
import { useApp } from "@/context/AppContext";
import { MANHWA_LIST } from "@/data/manhwa";
import { useColors } from "@/hooks/useColors";
import { useManhwaDetail, useManhwaChapters, type ApiChapter } from "@/hooks/useManhwaApi";

export default function DetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const {
    isFavorite, addToFavorites, removeFromFavorites,
    addToHistory, canUseAI, user,
  } = useApp();

  const { data: detailData, isLoading: loadingDetail } = useManhwaDetail(id);
  const { data: chapterData, isLoading: loadingChapters } = useManhwaChapters(id);

  const localFallback = MANHWA_LIST.find((m) => m.id === id);
  const manhwa = detailData?.manhwa ?? (localFallback ? { ...localFallback, chapters: [] } : null);
  const chapters = chapterData?.chapters ?? localFallback?.chapters ?? [];

  const [aiModalVisible, setAiModalVisible] = useState(false);
  const [selectedChapter, setSelectedChapter] = useState<ApiChapter | null>(null);
  const [expanded, setExpanded] = useState(false);

  if (!manhwa) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const favorite = isFavorite(manhwa.id);

  const COVER_COLORS = ["#1a0a0a", "#0a0a1a", "#0a1a0a", "#1a0a1a", "#0f0f1a"];
  const colorIndex = manhwa.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COVER_COLORS.length;

  const handleToggleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (favorite) {
      removeFromFavorites(manhwa.id);
    } else {
      addToFavorites({
        id: manhwa.id,
        title: manhwa.title,
        cover: manhwa.cover,
        genre: manhwa.genre[0] ?? "Manhwa",
        rating: manhwa.rating,
      });
    }
  };

  const handleReadChapter = (chapter: ApiChapter) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addToHistory({
      manhwaId: manhwa.id,
      manhwaTitle: manhwa.title,
      cover: manhwa.cover,
      chapterNumber: chapter.number,
      chapterTitle: chapter.title,
      readAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    });
    router.push({ pathname: "/reader", params: { manhwaId: manhwa.id, chapterId: chapter.id } });
  };

  const handleAITranslate = (chapter: ApiChapter) => {
    if (!canUseAI) {
      Alert.alert(
        "AI Limit Reached",
        user.plan === "free"
          ? `You've used all ${user.dailyAIChaptersLimit} AI chapters today. Watch an ad for +2 more, or upgrade to Premium for 50/day.`
          : "Daily limit reached.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Go to Profile", onPress: () => router.push("/(tabs)/profile") },
        ]
      );
      return;
    }
    setSelectedChapter(chapter);
    setAiModalVisible(true);
  };

  const descPreview = (manhwa.description ?? "").slice(0, 150) + ((manhwa.description ?? "").length > 150 ? "..." : "");

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
            onPress={handleToggleFavorite}
          >
            <MaterialCommunityIcons
              name={favorite ? "heart" : "heart-outline"}
              size={22}
              color={favorite ? colors.primary : "#fff"}
            />
          </TouchableOpacity>
        </View>

        <View style={[styles.hero, { backgroundColor: COVER_COLORS[colorIndex] }]}>
          {manhwa.cover ? (
            <Image source={{ uri: manhwa.cover }} style={[StyleSheet.absoluteFill, { opacity: 0.7 }]} resizeMode="cover" />
          ) : null}
          <View style={styles.heroOverlay} />
          {loadingDetail && <ActivityIndicator color={colors.primary} style={styles.heroLoader} />}
        </View>

        <View style={[styles.info, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.foreground }]}>{manhwa.title}</Text>

          <View style={styles.metaRow}>
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{manhwa.author}</Text>
            <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
            <Text style={[styles.meta, { color: colors.mutedForeground }]}>{manhwa.year}</Text>
            <View style={[styles.dot, { backgroundColor: colors.mutedForeground }]} />
            <View style={[styles.statusBadge, { backgroundColor: manhwa.status === "Ongoing" ? colors.primary : colors.muted }]}>
              <Text style={[styles.statusText, { color: manhwa.status === "Ongoing" ? "#fff" : colors.mutedForeground }]}>
                {manhwa.status}
              </Text>
            </View>
          </View>

          <View style={styles.stats}>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="star" size={16} color="#FFD700" />
              <Text style={[styles.statVal, { color: "#FFD700" }]}>{manhwa.rating.toFixed(1)}</Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="eye" size={16} color={colors.mutedForeground} />
              <Text style={[styles.statVal, { color: colors.mutedForeground }]}>{manhwa.views}</Text>
            </View>
            <View style={styles.stat}>
              <MaterialCommunityIcons name="book-multiple" size={16} color={colors.mutedForeground} />
              <Text style={[styles.statVal, { color: colors.mutedForeground }]}>{chapters.length} Ch.</Text>
            </View>
          </View>

          <View style={styles.genres}>
            {manhwa.genre.map((g) => (
              <View key={g} style={[styles.genreTag, { backgroundColor: colors.muted }]}>
                <Text style={[styles.genreText, { color: colors.mutedForeground }]}>{g}</Text>
              </View>
            ))}
          </View>

          {manhwa.description ? (
            <TouchableOpacity onPress={() => setExpanded(!expanded)} activeOpacity={0.8}>
              <Text style={[styles.description, { color: colors.foreground }]}>
                {expanded ? manhwa.description : descPreview}
              </Text>
              {manhwa.description.length > 150 && (
                <Text style={[styles.seeMore, { color: colors.primary }]}>
                  {expanded ? "Show less" : "Read more"}
                </Text>
              )}
            </TouchableOpacity>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.chapterHeaderRow}>
            <Text style={[styles.chapterHeader, { color: colors.foreground }]}>
              Chapters ({chapters.length})
            </Text>
            {loadingChapters && <ActivityIndicator size="small" color={colors.primary} />}
          </View>
        </View>

        {loadingChapters && chapters.length === 0
          ? [1, 2, 3, 4, 5].map((i) => (
              <View key={i} style={[styles.chapterRowSkeleton, { borderBottomColor: colors.border }]}>
                <View style={[styles.skeletonLine, { backgroundColor: colors.muted, width: "60%" }]} />
                <View style={[styles.skeletonLine, { backgroundColor: colors.muted, width: "35%" }]} />
              </View>
            ))
          : chapters.map((chapter) => (
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
                  <Text style={[styles.chapterMeta, { color: colors.mutedForeground }]}>
                    {chapter.date} · {chapter.pages} pages
                  </Text>
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
            ))}

        <View style={{ height: 80 }} />
      </ScrollView>

      {selectedChapter && (
        <AITranslationModal
          visible={aiModalVisible}
          onClose={() => { setAiModalVisible(false); setSelectedChapter(null); }}
          chapterTitle={selectedChapter.title}
          totalPages={selectedChapter.pages}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, alignItems: "center", justifyContent: "center" },
  backHeader: {
    flexDirection: "row", justifyContent: "space-between",
    paddingHorizontal: 16, paddingTop: 48, paddingBottom: 8,
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 10,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  hero: { height: 280, position: "relative" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.3)" },
  heroLoader: { position: "absolute", bottom: 16, right: 16 },
  info: { padding: 20, gap: 12 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", lineHeight: 30 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  meta: { fontSize: 13, fontFamily: "Inter_400Regular" },
  dot: { width: 3, height: 3, borderRadius: 1.5 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  stats: { flexDirection: "row", gap: 20 },
  stat: { flexDirection: "row", alignItems: "center", gap: 5 },
  statVal: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  genres: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  genreTag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  genreText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  description: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  seeMore: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  divider: { height: 0.5, marginVertical: 4 },
  chapterHeaderRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  chapterHeader: { fontSize: 17, fontFamily: "Inter_700Bold" },
  chapterRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 13, paddingHorizontal: 20, borderBottomWidth: 0.5,
  },
  chapterRowSkeleton: {
    gap: 6, paddingVertical: 16, paddingHorizontal: 20, borderBottomWidth: 0.5,
  },
  skeletonLine: { height: 10, borderRadius: 5 },
  chapterLeft: { flex: 1, gap: 4 },
  newBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: "flex-start" },
  newBadgeText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  chapterTitle: { fontSize: 13, fontFamily: "Inter_500Medium" },
  chapterMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  chapterActions: { flexDirection: "row", gap: 8 },
  aiBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  readBtn: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
});
