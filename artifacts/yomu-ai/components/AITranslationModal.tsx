import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const { width, height } = Dimensions.get("window");

const MOCK_TRANSLATIONS: string[] = [
  "The darkness that lurks at the edge of the world... I can feel it approaching.",
  "\"You dare challenge me?\" The warrior's eyes gleamed with a crimson light.",
  "\"Rank S... I never expected to reach this level.\"",
  "The gate pulsed with an ominous energy. Inside, something ancient was awakening.",
  "\"System Notification: You have leveled up. New skill unlocked: Shadow Extraction.\"",
  "He stood alone against an army of ten thousand. And yet, he smiled.",
  "\"This is my power. The power that will reshape this world.\"",
  "The shadows obeyed his command without hesitation. He was their king.",
  "\"Run,\" he whispered to the monsters. \"Run while you still can.\"",
  "Level: ??? | Strength: IMMEASURABLE | Status: MONARCH",
];

interface Props {
  visible: boolean;
  onClose: () => void;
  chapterTitle: string;
  totalPages: number;
}

export function AITranslationModal({ visible, onClose, chapterTitle, totalPages }: Props) {
  const colors = useColors();
  const [currentPage, setCurrentPage] = useState(0);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translated, setTranslated] = useState<string[]>([]);
  const [started, setStarted] = useState(false);

  const simulateTranslate = async (pageIndex: number) => {
    setIsTranslating(true);
    await new Promise((resolve) => setTimeout(resolve, 1500 + Math.random() * 1000));
    const text = MOCK_TRANSLATIONS[pageIndex % MOCK_TRANSLATIONS.length];
    setTranslated((prev) => {
      const updated = [...prev];
      updated[pageIndex] = text;
      return updated;
    });
    setIsTranslating(false);
  };

  const handleStart = async () => {
    setStarted(true);
    setCurrentPage(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await simulateTranslate(0);
  };

  const handleNext = async () => {
    const next = currentPage + 1;
    if (next >= totalPages) return;
    setCurrentPage(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!translated[next]) {
      await simulateTranslate(next);
    }
  };

  const handleClose = () => {
    setStarted(false);
    setCurrentPage(0);
    setTranslated([]);
    setIsTranslating(false);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={[styles.aiBadge, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="translate" size={14} color="#fff" />
                <Text style={styles.aiBadgeText}>AI</Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
                {chapterTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {!started ? (
            <View style={styles.startContainer}>
              <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
                <MaterialCommunityIcons name="robot-excited" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.startTitle, { color: colors.foreground }]}>
                Traduire avec AI?
              </Text>
              <Text style={[styles.startDesc, { color: colors.mutedForeground }]}>
                Our AI will translate each page one by one using OCR and advanced language models. Tap a button to proceed to the next page.
              </Text>
              <View style={[styles.infoBox, { backgroundColor: colors.muted }]}>
                <MaterialCommunityIcons name="information-outline" size={16} color={colors.primary} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  {totalPages} pages · OCR + LLM Translation
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.primary }]}
                onPress={handleStart}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="play" size={18} color="#fff" />
                <Text style={styles.startBtnText}>Start Translation</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.readerContainer}>
              <View style={styles.pageProgress}>
                <Text style={[styles.pageNum, { color: colors.mutedForeground }]}>
                  Page {currentPage + 1} / {totalPages}
                </Text>
                <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                  <View
                    style={[
                      styles.progressFill,
                      {
                        backgroundColor: colors.primary,
                        width: `${((currentPage + 1) / totalPages) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              <View style={[styles.pageView, { backgroundColor: colors.background }]}>
                <View style={styles.mockPage}>
                  <View style={styles.mockPanel}>
                    <View style={[styles.mockStrip, { backgroundColor: colors.border }]} />
                    <View style={[styles.mockStrip, { backgroundColor: colors.border, width: "70%" }]} />
                    <View style={[styles.mockStrip, { backgroundColor: colors.border, width: "85%" }]} />
                  </View>
                  <View style={[styles.speechBubble, { borderColor: colors.primary }]}>
                    {isTranslating ? (
                      <View style={styles.translatingRow}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={[styles.translatingText, { color: colors.mutedForeground }]}>
                          Translating...
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.translatedText, { color: colors.foreground }]}>
                        {translated[currentPage] || ""}
                      </Text>
                    )}
                  </View>
                </View>
              </View>

              <View style={styles.controls}>
                {currentPage < totalPages - 1 ? (
                  <TouchableOpacity
                    style={[
                      styles.nextBtn,
                      { backgroundColor: isTranslating ? colors.muted : colors.primary },
                    ]}
                    onPress={handleNext}
                    disabled={isTranslating}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.nextBtnText, { color: isTranslating ? colors.mutedForeground : "#fff" }]}>
                      Suivant
                    </Text>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={18}
                      color={isTranslating ? colors.mutedForeground : "#fff"}
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: "#2E7D32" }]}
                    onPress={handleClose}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="check" size={18} color="#fff" />
                    <Text style={styles.nextBtnText}>Terminé</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 40,
    maxHeight: height * 0.85,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  aiBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aiBadgeText: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  startContainer: {
    padding: 24,
    alignItems: "center",
    gap: 16,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  startTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  startDesc: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    width: "100%",
  },
  infoText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    justifyContent: "center",
  },
  startBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  readerContainer: {
    padding: 20,
    gap: 16,
  },
  pageProgress: {
    gap: 8,
  },
  pageNum: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  pageView: {
    borderRadius: 12,
    overflow: "hidden",
    height: 280,
    alignItems: "center",
    justifyContent: "center",
  },
  mockPage: {
    width: "100%",
    padding: 20,
    gap: 16,
  },
  mockPanel: {
    gap: 8,
  },
  mockStrip: {
    height: 12,
    borderRadius: 6,
    width: "100%",
  },
  speechBubble: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 14,
    minHeight: 80,
    justifyContent: "center",
  },
  translatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  translatingText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  translatedText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
  },
  controls: {
    gap: 10,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
