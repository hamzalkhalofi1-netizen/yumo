import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AITranslationModal } from "@/components/AITranslationModal";
import { useApp } from "@/context/AppContext";
import { MANHWA_LIST } from "@/data/manhwa";
import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

const PAGE_COLORS = [
  ["#0d0d0d", "#1a0505"],
  ["#050510", "#0d0d1a"],
  ["#051005", "#0d1a0d"],
  ["#100505", "#1a0d0d"],
  ["#0a0a10", "#141420"],
];

export default function ReaderScreen() {
  const { manhwaId, chapterId } = useLocalSearchParams<{ manhwaId: string; chapterId: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canUseAI, useAIChapter } = useApp();

  const manhwa = MANHWA_LIST.find((m) => m.id === manhwaId) ?? MANHWA_LIST[0];
  const chapter = manhwa.chapters.find((c) => c.id === chapterId) ?? manhwa.chapters[0];

  const [showControls, setShowControls] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [aiModalVisible, setAiModalVisible] = useState(false);

  const pages = Array.from({ length: chapter.pages }, (_, i) => i);

  const handlePageTap = () => {
    setShowControls((prev) => !prev);
  };

  const handleAI = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setAiModalVisible(true);
  };

  return (
    <View style={[styles.container, { backgroundColor: "#000" }]}>
      <ScrollView
        style={styles.scroll}
        onScroll={(e) => {
          const offset = e.nativeEvent.contentOffset.y;
          const pageHeight = height * 0.7;
          const page = Math.floor(offset / pageHeight);
          setCurrentPage(Math.min(page, chapter.pages - 1));
        }}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onTouchEnd={handlePageTap}
      >
        {pages.map((pageIdx) => {
          const colorPair = PAGE_COLORS[pageIdx % PAGE_COLORS.length];
          return (
            <View
              key={pageIdx}
              style={[styles.page, { minHeight: height * 0.7, backgroundColor: colorPair[0] }]}
            >
              <View style={[styles.pageContent, { backgroundColor: colorPair[0] }]}>
                <View style={[styles.panel1, { backgroundColor: colorPair[1] }]}>
                  <View style={[styles.panelStrip, { backgroundColor: "rgba(229,57,53,0.2)" }]} />
                </View>
                <View style={styles.panelRow}>
                  <View style={[styles.panel2, { backgroundColor: "rgba(255,255,255,0.03)" }]} />
                  <View style={[styles.panel3, { backgroundColor: colorPair[1] }]} />
                </View>
                <View style={[styles.panel4, { backgroundColor: "rgba(255,255,255,0.02)" }]} />
                <View style={[styles.pageNumber]}>
                  <Text style={[styles.pageNumberText, { color: "rgba(255,255,255,0.2)" }]}>
                    {pageIdx + 1}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {showControls && (
        <>
          <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: "rgba(0,0,0,0.85)" }]}>
            <TouchableOpacity
              style={styles.topBtn}
              onPress={() => router.back()}
            >
              <MaterialCommunityIcons name="arrow-left" size={22} color="#fff" />
            </TouchableOpacity>
            <View style={styles.topInfo}>
              <Text style={styles.topTitle} numberOfLines={1}>{manhwa.title}</Text>
              <Text style={styles.topMeta}>{chapter.title}</Text>
            </View>
            <TouchableOpacity style={styles.topBtn} onPress={handleAI}>
              <MaterialCommunityIcons name="translate" size={22} color={colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8, backgroundColor: "rgba(0,0,0,0.85)" }]}>
            <Text style={styles.pageInfo}>
              {currentPage + 1} / {chapter.pages}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${((currentPage + 1) / chapter.pages) * 100}%`,
                  },
                ]}
              />
            </View>
            <TouchableOpacity
              style={[styles.aiTranslateBtn, { backgroundColor: colors.primary }]}
              onPress={handleAI}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="translate" size={14} color="#fff" />
              <Text style={styles.aiTranslateBtnText}>Traduire avec AI?</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <AITranslationModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        chapterTitle={chapter.title}
        totalPages={chapter.pages}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flex: 1 },
  page: {
    width,
    overflow: "hidden",
  },
  pageContent: {
    flex: 1,
    padding: 0,
    gap: 2,
  },
  panel1: {
    height: "40%",
    justifyContent: "center",
    alignItems: "center",
  },
  panelStrip: {
    width: "60%",
    height: 4,
    borderRadius: 2,
  },
  panelRow: {
    flexDirection: "row",
    height: "35%",
    gap: 2,
  },
  panel2: {
    flex: 1,
  },
  panel3: {
    flex: 1,
  },
  panel4: {
    height: "25%",
  },
  pageNumber: {
    position: "absolute",
    bottom: 12,
    right: 16,
  },
  pageNumberText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    letterSpacing: 1,
  },
  topBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  topInfo: {
    flex: 1,
    gap: 2,
  },
  topTitle: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  topMeta: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    alignItems: "center",
  },
  pageInfo: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  progressBar: {
    width: "100%",
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  aiTranslateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 22,
  },
  aiTranslateBtnText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
});
