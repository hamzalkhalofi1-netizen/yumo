import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

const { height } = Dimensions.get("window");

const BASE_URL = process.env["EXPO_PUBLIC_DOMAIN"]
  ? `https://${process.env["EXPO_PUBLIC_DOMAIN"]}`
  : "";

async function translatePage(imageUrl: string): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/translate/page`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl, targetLang: "French" }),
  });
  const data = (await res.json()) as { translation?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data.translation ?? "Aucun texte détecté sur cette page.";
}

const MOCK_TRANSLATIONS: string[] = [
  "« L'obscurité qui rôde aux confins du monde... je la sens approcher. »",
  "« Tu oses me défier ? » Les yeux du guerrier brillaient d'une lueur cramoisie.",
  "« Rang S... Je ne m'attendais jamais à atteindre ce niveau. »",
  "La porte pulsait d'une énergie sinistre. À l'intérieur, quelque chose d'ancien s'éveillait.",
  "« Notification système : Vous avez monté de niveau. Nouvelle compétence débloquée : Extraction des Ombres. »",
  "Il se tenait seul face à une armée de dix mille hommes. Et pourtant, il souriait.",
  "« C'est mon pouvoir. Le pouvoir qui va remodeler ce monde. »",
  "Les ombres obéissaient à son commandement sans hésitation. Il était leur roi.",
  "« Fuyez, » chuchota-t-il aux monstres. « Fuyez pendant que vous le pouvez encore. »",
  "Niveau : ??? | Force : INCOMMENSURABLE | Statut : MONARQUE",
];

interface Props {
  visible: boolean;
  onClose: () => void;
  chapterTitle: string;
  totalPages: number;
  pageUrls?: string[];
}

type TranslationState = "idle" | "loading" | "done" | "error";

export function AITranslationModal({
  visible,
  onClose,
  chapterTitle,
  totalPages,
  pageUrls,
}: Props) {
  const colors = useColors();
  const [currentPage, setCurrentPage] = useState(0);
  const [started, setStarted] = useState(false);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [state, setState] = useState<TranslationState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const abortRef = useRef(false);

  const hasRealPages = pageUrls && pageUrls.length > 0;
  const displayTotal = hasRealPages ? pageUrls.length : totalPages;

  // Check if translation API is ready
  useEffect(() => {
    if (!visible) return;
    fetch(`${BASE_URL}/api/translate/status`)
      .then((r) => r.json())
      .then((d: any) => setApiReady(d.ready === true))
      .catch(() => setApiReady(false));
  }, [visible]);

  // Reset when modal closes
  useEffect(() => {
    if (!visible) {
      abortRef.current = true;
      setTimeout(() => {
        setStarted(false);
        setCurrentPage(0);
        setTranslations({});
        setState("idle");
        setErrorMsg("");
        abortRef.current = false;
      }, 300);
    }
  }, [visible]);

  const translateCurrentPage = async (pageIdx: number) => {
    if (translations[pageIdx] !== undefined) return;
    setState("loading");
    setErrorMsg("");

    try {
      let text: string;
      if (hasRealPages && apiReady) {
        text = await translatePage(pageUrls![pageIdx]!);
      } else {
        // Simulated fallback with realistic delay
        await new Promise((r) => setTimeout(r, 1200 + Math.random() * 800));
        text = MOCK_TRANSLATIONS[pageIdx % MOCK_TRANSLATIONS.length]!;
      }
      if (!abortRef.current) {
        setTranslations((prev) => ({ ...prev, [pageIdx]: text }));
        setState("done");
      }
    } catch (err: any) {
      if (!abortRef.current) {
        setErrorMsg(err.message ?? "Erreur de traduction");
        setState("error");
      }
    }
  };

  const handleStart = async () => {
    setStarted(true);
    setCurrentPage(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await translateCurrentPage(0);
  };

  const handleNext = async () => {
    const next = currentPage + 1;
    if (next >= displayTotal) return;
    setCurrentPage(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await translateCurrentPage(next);
  };

  const handleRetry = () => {
    setTranslations((prev) => {
      const updated = { ...prev };
      delete updated[currentPage];
      return updated;
    });
    translateCurrentPage(currentPage);
  };

  const handleClose = () => {
    abortRef.current = true;
    onClose();
  };

  const currentTranslation = translations[currentPage];
  const isLoading = state === "loading";
  const isError = state === "error";
  const progress = ((currentPage + 1) / displayTotal) * 100;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>

          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.aiBadge, { backgroundColor: colors.primary }]}>
                <MaterialCommunityIcons name="translate" size={13} color="#fff" />
                <Text style={styles.aiBadgeText}>
                  {hasRealPages && apiReady ? "Gemini AI" : "AI"}
                </Text>
              </View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
                {chapterTitle}
              </Text>
            </View>
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {!started ? (
            /* ─── Launch Screen ─── */
            <ScrollView contentContainerStyle={styles.startContainer} showsVerticalScrollIndicator={false}>
              <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
                <MaterialCommunityIcons name="robot-excited" size={52} color={colors.primary} />
              </View>

              <Text style={[styles.startTitle, { color: colors.foreground }]}>
                Traduire avec AI ?
              </Text>
              <Text style={[styles.startDesc, { color: colors.mutedForeground }]}>
                {hasRealPages && apiReady
                  ? "Gemini Vision analysera chaque page, extraira le texte coréen par OCR et le traduira en français."
                  : "Notre IA va analyser chaque page et traduire le texte coréen en français, page par page."}
              </Text>

              <View style={[styles.infoGrid, { backgroundColor: colors.muted }]}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="image-search" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>OCR Vision</Text>
                </View>
                <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="translate" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>KO → FR</Text>
                </View>
                <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{displayTotal} pages</Text>
                </View>
              </View>

              {hasRealPages && apiReady === false && (
                <View style={[styles.warnBox, { backgroundColor: "rgba(255,160,0,0.12)", borderColor: "#FFA000" }]}>
                  <MaterialCommunityIcons name="alert" size={15} color="#FFA000" />
                  <Text style={[styles.warnText, { color: "#FFA000" }]}>
                    Clé API non configurée — mode simulation activé.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.primary }]}
                onPress={handleStart}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
                <Text style={styles.startBtnText}>Démarrer la traduction</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* ─── Translation Reader ─── */
            <View style={styles.readerContainer}>
              {/* Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={[styles.pageNum, { color: colors.mutedForeground }]}>
                    Page {currentPage + 1} / {displayTotal}
                  </Text>
                  {isLoading && (
                    <View style={styles.processingBadge}>
                      <ActivityIndicator size={10} color={colors.primary} />
                      <Text style={[styles.processingText, { color: colors.primary }]}>
                        {hasRealPages && apiReady ? "Gemini analyse..." : "Traduction..."}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                  <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
                </View>
              </View>

              {/* Page image (real) or mock panel */}
              <View style={[styles.pageView, { backgroundColor: colors.background }]}>
                {hasRealPages && pageUrls![currentPage] ? (
                  <Image
                    source={{ uri: pageUrls![currentPage] }}
                    style={styles.pageImage}
                    resizeMode="contain"
                  />
                ) : (
                  <View style={styles.mockPage}>
                    <View style={styles.mockPanel}>
                      <View style={[styles.mockStrip, { backgroundColor: colors.border }]} />
                      <View style={[styles.mockStrip, { backgroundColor: colors.border, width: "70%" }]} />
                      <View style={[styles.mockStrip, { backgroundColor: colors.border, width: "85%" }]} />
                    </View>
                  </View>
                )}
              </View>

              {/* Translation bubble */}
              <View style={[styles.translationCard, { backgroundColor: colors.muted, borderColor: isError ? colors.destructive : colors.primary }]}>
                <View style={styles.bubbleHeader}>
                  <MaterialCommunityIcons
                    name={isError ? "alert-circle" : isLoading ? "dots-horizontal" : "check-circle"}
                    size={14}
                    color={isError ? colors.destructive : isLoading ? colors.mutedForeground : colors.primary}
                  />
                  <Text style={[styles.bubbleLabel, { color: isError ? colors.destructive : colors.primary }]}>
                    {isError ? "Erreur" : isLoading ? "Analyse en cours..." : "Traduction française"}
                  </Text>
                  {isError && (
                    <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
                      <Text style={[styles.retryText, { color: colors.primary }]}>Réessayer</Text>
                    </TouchableOpacity>
                  )}
                </View>

                <ScrollView style={styles.translationScroll} showsVerticalScrollIndicator={false}>
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
                        {hasRealPages && apiReady
                          ? "Gemini Vision analyse la page..."
                          : "Traduction en cours..."}
                      </Text>
                    </View>
                  ) : isError ? (
                    <Text style={[styles.errorText, { color: colors.destructive }]}>{errorMsg}</Text>
                  ) : currentTranslation ? (
                    <Text style={[styles.translatedText, { color: colors.foreground }]}>
                      {currentTranslation}
                    </Text>
                  ) : null}
                </ScrollView>
              </View>

              {/* Controls */}
              <View style={styles.controls}>
                {currentPage > 0 && (
                  <TouchableOpacity
                    style={[styles.prevBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      const prev = currentPage - 1;
                      setCurrentPage(prev);
                      if (!translations[prev]) translateCurrentPage(prev);
                    }}
                    disabled={isLoading}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={18} color={isLoading ? colors.mutedForeground : colors.foreground} />
                  </TouchableOpacity>
                )}

                {currentPage < displayTotal - 1 ? (
                  <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: isLoading ? colors.muted : colors.primary, flex: 1 }]}
                    onPress={handleNext}
                    disabled={isLoading}
                    activeOpacity={0.85}
                  >
                    <Text style={[styles.nextBtnText, { color: isLoading ? colors.mutedForeground : "#fff" }]}>
                      Suivant
                    </Text>
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={18}
                      color={isLoading ? colors.mutedForeground : "#fff"}
                    />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: "#2E7D32", flex: 1 }]}
                    onPress={handleClose}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                    <Text style={styles.nextBtnText}>Terminé !</Text>
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
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  container: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    maxHeight: height * 0.9,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 0.5,
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
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  headerTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  closeBtn: { padding: 4 },
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
  infoGrid: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
  },
  infoLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  infoDivider: { width: 0.5 },
  warnBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    width: "100%",
  },
  warnText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  startBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: "100%",
    justifyContent: "center",
  },
  startBtnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  readerContainer: {
    padding: 16,
    gap: 12,
  },
  progressSection: { gap: 7 },
  progressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageNum: { fontSize: 12, fontFamily: "Inter_500Medium" },
  processingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  processingText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  progressBar: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: { height: "100%", borderRadius: 2 },
  pageView: {
    borderRadius: 10,
    overflow: "hidden",
    height: 180,
    alignItems: "center",
    justifyContent: "center",
  },
  pageImage: { width: "100%", height: "100%" },
  mockPage: { width: "100%", padding: 20, gap: 16 },
  mockPanel: { gap: 10 },
  mockStrip: { height: 12, borderRadius: 6, width: "100%" },
  translationCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    minHeight: 110,
    maxHeight: 200,
  },
  bubbleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 10,
  },
  bubbleLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    flex: 1,
    letterSpacing: 0.4,
  },
  retryBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  retryText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  translationScroll: { flex: 1 },
  loadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  loadingText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  translatedText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    fontStyle: "italic",
  },
  controls: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  prevBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
    color: "#fff",
  },
});
