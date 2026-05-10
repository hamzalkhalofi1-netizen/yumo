import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AITranslationModal } from "@/components/AITranslationModal";
import { useColors } from "@/hooks/useColors";
import { useScrapeChapter } from "@/hooks/useScraperApi";

const { width, height } = Dimensions.get("window");

export default function ScraperReaderScreen() {
  const { chapterUrl, title } = useLocalSearchParams<{ chapterUrl: string; title: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [showControls, setShowControls] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [aiVisible, setAiVisible] = useState(false);

  const { data, isLoading, isError, error, refetch } = useScrapeChapter(chapterUrl, true);
  const pages = data?.pages ?? [];

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: "rgba(255,255,255,0.6)" }]}>
          Scraping chapter pages...
        </Text>
      </View>
    );
  }

  if (isError || pages.length === 0) {
    return (
      <View style={[styles.center, { backgroundColor: "#000" }]}>
        <MaterialCommunityIcons name="image-off" size={52} color="rgba(255,255,255,0.3)" />
        <Text style={[styles.errorTitle, { color: "#fff" }]}>Could Not Load Pages</Text>
        <Text style={[styles.errorDesc, { color: "rgba(255,255,255,0.5)" }]}>
          {isError
            ? ((error as Error)?.message ?? "Failed to scrape chapter pages.")
            : "No images found on this chapter page. The site may use JavaScript rendering or a non-standard format."}
        </Text>
        <View style={styles.errorActions}>
          <TouchableOpacity style={[styles.btn, { backgroundColor: "rgba(255,255,255,0.1)" }]} onPress={() => router.back()}>
            <Text style={[styles.btnText, { color: "#fff" }]}>Go Back</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, { backgroundColor: colors.primary }]} onPress={() => refetch()}>
            <Text style={[styles.btnText, { color: "#fff" }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <FlatList
        data={pages}
        keyExtractor={(item, idx) => `${item.url}_${idx}`}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => {
          const offset = e.nativeEvent.contentOffset.y;
          const page = Math.floor(offset / (height * 0.6));
          setCurrentPage(Math.max(0, Math.min(page, pages.length - 1)));
        }}
        scrollEventThrottle={16}
        onTouchEnd={() => setShowControls((v) => !v)}
        renderItem={({ item }) => (
          <View style={styles.pageContainer}>
            <Image
              source={{ uri: item.url }}
              style={styles.pageImage}
              resizeMode="contain"
            />
          </View>
        )}
      />

      {showControls && (
        <>
          <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: "rgba(0,0,0,0.85)" }]}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.topInfo}>
              <Text style={styles.topTitle} numberOfLines={1}>{title}</Text>
              <Text style={styles.topMeta}>{currentPage + 1} / {pages.length} pages</Text>
            </View>
            <TouchableOpacity style={styles.iconBtn} onPress={() => setAiVisible(true)}>
              <MaterialCommunityIcons name="translate" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8, backgroundColor: "rgba(0,0,0,0.85)" }]}>
            <View style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: pages.length > 0 ? `${((currentPage + 1) / pages.length) * 100}%` : "0%",
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              style={[styles.aiBtn, { backgroundColor: colors.primary }]}
              onPress={() => setAiVisible(true)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="translate" size={14} color="#fff" />
              <Text style={styles.aiBtnText}>Traduire avec AI?</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <AITranslationModal
        visible={aiVisible}
        onClose={() => setAiVisible(false)}
        chapterTitle={title ?? "Chapter"}
        totalPages={pages.length}
        pageUrls={pages.map((p) => p.url)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  loadingText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  errorTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  errorDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  errorActions: { flexDirection: "row", gap: 10, marginTop: 4 },
  btn: { paddingVertical: 11, paddingHorizontal: 22, borderRadius: 10 },
  btnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  pageContainer: { width, minHeight: height * 0.65 },
  pageImage: { width, minHeight: height * 0.65 },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0,
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 12,
  },
  iconBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  topInfo: { flex: 1, gap: 2 },
  topTitle: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  topMeta: { color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "Inter_400Regular" },
  bottomBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 16, paddingTop: 12, gap: 10, alignItems: "center",
  },
  progressBar: { width: "100%", height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },
  aiBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingVertical: 10, paddingHorizontal: 20, borderRadius: 22,
  },
  aiBtnText: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
});
