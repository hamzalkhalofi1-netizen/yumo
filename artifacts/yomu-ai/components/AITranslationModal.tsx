import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  I18nManager,
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

// ─── Supported languages ──────────────────────────────────────────────────────
const LANGUAGES = [
  { code: "Arabic",  label: "العربية", flag: "🇸🇦", rtl: true  },
  { code: "English", label: "English",  flag: "🇬🇧", rtl: false },
  { code: "French",  label: "Français", flag: "🇫🇷", rtl: false },
] as const;

type LangCode = (typeof LANGUAGES)[number]["code"];

// ─── Mock translations per language (fallback) ───────────────────────────────
const MOCK: Record<LangCode, string[]> = {
  Arabic: [
    "١. «الظلام الذي يتربص عند أطراف العالم... أستطيع أن أشعر به وهو يقترب.»",
    "١. «هل تجرؤ على تحديّي؟» أضاءت عيون المحارب بضوء قرمزي.",
    "١. «المرتبة S... لم أتوقع أبداً أن أصل إلى هذا المستوى.»",
    "١. نبضت البوابة بطاقة مشؤومة. في الداخل، كان شيء قديم يصحو.",
    "١. «إشعار النظام: لقد ارتقيت مستوى. مهارة جديدة مفتوحة: استخراج الظلال.»",
    "١. وقف وحيداً في مواجهة جيش مؤلف من عشرة آلاف. ومع ذلك، ابتسم.",
    "١. «هذه قوتي. القوة التي ستعيد تشكيل هذا العالم.»",
    "١. أطاعت الظلال أوامره دون تردد. كان ملكها.",
    "١. «اهربوا،» همس للوحوش. «اهربوا بينما تستطيعون.»",
    "١. المستوى: ؟؟؟ | القوة: لا تُقاس | الحالة: الملك الأعظم",
  ],
  English: [
    '1. "The darkness that lurks at the edge of the world... I can feel it approaching."',
    '1. "You dare challenge me?" The warrior\'s eyes gleamed with a crimson light.',
    '1. "Rank S... I never expected to reach this level."',
    "1. The gate pulsed with an ominous energy. Inside, something ancient was awakening.",
    '1. "System Notification: You have leveled up. New skill unlocked: Shadow Extraction."',
    "1. He stood alone against an army of ten thousand. And yet, he smiled.",
    '1. "This is my power. The power that will reshape this world."',
    "1. The shadows obeyed his command without hesitation. He was their king.",
    '1. "Run," he whispered to the monsters. "Run while you still can."',
    "1. Level: ??? | Strength: IMMEASURABLE | Status: MONARCH",
  ],
  French: [
    "1. « L'obscurité qui rôde aux confins du monde... je la sens approcher. »",
    "1. « Tu oses me défier ? » Les yeux du guerrier brillaient d'une lueur cramoisie.",
    "1. « Rang S... Je ne m'attendais jamais à atteindre ce niveau. »",
    "1. La porte pulsait d'une énergie sinistre. À l'intérieur, quelque chose d'ancien s'éveillait.",
    "1. « Notification système : Vous avez monté de niveau. Nouvelle compétence débloquée : Extraction des Ombres. »",
    "1. Il se tenait seul face à une armée de dix mille hommes. Et pourtant, il souriait.",
    "1. « C'est mon pouvoir. Le pouvoir qui va remodeler ce monde. »",
    "1. Les ombres obéissaient à son commandement sans hésitation. Il était leur roi.",
    "1. « Fuyez, » chuchota-t-il aux monstres. « Fuyez pendant que vous le pouvez encore. »",
    "1. Niveau : ??? | Force : INCOMMENSURABLE | Statut : MONARQUE",
  ],
};

const LABELS: Record<LangCode, { start: string; loading: string; noText: string; next: string; done: string; error: string }> = {
  Arabic: {
    start:   "ترجمة مع AI؟",
    loading: "يحلل Gemini الصفحة...",
    noText:  "لا يوجد نص في هذه الصفحة.",
    next:    "التالي",
    done:    "انتهى!",
    error:   "خطأ",
  },
  English: {
    start:   "Translate with AI?",
    loading: "Gemini analysing page...",
    noText:  "No text detected on this page.",
    next:    "Next",
    done:    "Done!",
    error:   "Error",
  },
  French: {
    start:   "Traduire avec AI?",
    loading: "Gemini analyse la page...",
    noText:  "Aucun texte détecté sur cette page.",
    next:    "Suivant",
    done:    "Terminé!",
    error:   "Erreur",
  },
};

async function translatePage(imageUrl: string, targetLang: LangCode): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/translate/page`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ imageUrl, targetLang }),
  });
  const data = (await res.json()) as { translation?: string; error?: string };
  if (!res.ok) throw new Error(data.error ?? `Error ${res.status}`);
  return data.translation ?? LABELS[targetLang].noText;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  onClose: () => void;
  chapterTitle: string;
  totalPages: number;
  pageUrls?: string[];
}

type TranslationState = "idle" | "loading" | "done" | "error";

// ─── Component ────────────────────────────────────────────────────────────────
export function AITranslationModal({ visible, onClose, chapterTitle, totalPages, pageUrls }: Props) {
  const colors = useColors();

  const [selectedLang, setSelectedLang] = useState<LangCode>("Arabic");
  const [currentPage, setCurrentPage] = useState(0);
  const [started, setStarted] = useState(false);
  const [translations, setTranslations] = useState<Record<number, string>>({});
  const [state, setState] = useState<TranslationState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [apiReady, setApiReady] = useState<boolean | null>(null);
  const abortRef = useRef(false);

  const hasRealPages = (pageUrls?.length ?? 0) > 0;
  const displayTotal = hasRealPages ? (pageUrls?.length ?? 0) : totalPages;
  const L = LABELS[selectedLang];
  const isRTL = LANGUAGES.find((l) => l.code === selectedLang)?.rtl ?? false;

  // Validate API key on open
  useEffect(() => {
    if (!visible) return;
    fetch(`${BASE_URL}/api/translate/status`)
      .then((r) => r.json())
      .then((d: any) => setApiReady(d.ready === true))
      .catch(() => setApiReady(false));
  }, [visible]);

  // Reset on close
  useEffect(() => {
    if (!visible) {
      abortRef.current = true;
      const t = setTimeout(() => {
        setStarted(false);
        setCurrentPage(0);
        setTranslations({});
        setState("idle");
        setErrorMsg("");
        abortRef.current = false;
      }, 300);
      return () => clearTimeout(t);
    }
  }, [visible]);

  // Clear cached translations when language changes
  useEffect(() => {
    setTranslations({});
  }, [selectedLang]);

  const translateCurrent = async (pageIdx: number) => {
    if (translations[pageIdx] !== undefined) return;
    setState("loading");
    setErrorMsg("");
    try {
      let text: string;
      if (hasRealPages && apiReady) {
        text = await translatePage(pageUrls![pageIdx]!, selectedLang);
      } else {
        await new Promise((r) => setTimeout(r, 1100 + Math.random() * 700));
        text = MOCK[selectedLang][pageIdx % MOCK[selectedLang].length]!;
      }
      if (!abortRef.current) {
        setTranslations((prev) => ({ ...prev, [pageIdx]: text }));
        setState("done");
      }
    } catch (err: any) {
      if (!abortRef.current) {
        setErrorMsg(err.message ?? "فشل الترجمة");
        setState("error");
      }
    }
  };

  const handleStart = async () => {
    setStarted(true);
    setCurrentPage(0);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await translateCurrent(0);
  };

  const handleNext = async () => {
    const next = currentPage + 1;
    if (next >= displayTotal) return;
    setCurrentPage(next);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await translateCurrent(next);
  };

  const handlePrev = () => {
    const prev = currentPage - 1;
    if (prev < 0) return;
    setCurrentPage(prev);
    if (!translations[prev]) translateCurrent(prev);
  };

  const handleRetry = () => {
    setTranslations((prev) => { const u = { ...prev }; delete u[currentPage]; return u; });
    translateCurrent(currentPage);
  };

  const handleClose = () => { abortRef.current = true; onClose(); };

  const currentTranslation = translations[currentPage];
  const isLoading = state === "loading";
  const isError = state === "error";
  const progress = ((currentPage + 1) / displayTotal) * 100;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={[styles.container, { backgroundColor: colors.card }]}>

          {/* ── Header ── */}
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
            <TouchableOpacity onPress={handleClose} style={styles.closeBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <MaterialCommunityIcons name="close" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {!started ? (
            /* ── Launch Screen ── */
            <ScrollView contentContainerStyle={styles.startContainer} showsVerticalScrollIndicator={false}>
              <View style={[styles.iconCircle, { backgroundColor: colors.muted }]}>
                <MaterialCommunityIcons name="robot-excited" size={52} color={colors.primary} />
              </View>

              <Text style={[styles.startTitle, { color: colors.foreground }]}>{L.start}</Text>
              <Text style={[styles.startDesc, { color: colors.mutedForeground }]}>
                {hasRealPages && apiReady
                  ? "Gemini Vision سيحلل كل صفحة، ويستخرج النص الكوري ويترجمه."
                  : "سيحلل الذكاء الاصطناعي كل صفحة ويترجم النص الكوري صفحة بصفحة."}
              </Text>

              {/* ── Language Selector ── */}
              <View style={styles.langSelectorLabel}>
                <MaterialCommunityIcons name="earth" size={14} color={colors.mutedForeground} />
                <Text style={[styles.langSelectorTitle, { color: colors.mutedForeground }]}>
                  لغة الترجمة
                </Text>
              </View>
              <View style={[styles.langRow, { backgroundColor: colors.muted }]}>
                {LANGUAGES.map((lang) => {
                  const active = selectedLang === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      style={[
                        styles.langBtn,
                        active && { backgroundColor: colors.primary },
                      ]}
                      onPress={() => {
                        setSelectedLang(lang.code);
                        Haptics.selectionAsync();
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.langFlag}>{lang.flag}</Text>
                      <Text style={[
                        styles.langLabel,
                        { color: active ? "#fff" : colors.mutedForeground },
                        active && { fontFamily: "Inter_700Bold" },
                      ]}>
                        {lang.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Info grid ── */}
              <View style={[styles.infoGrid, { backgroundColor: colors.muted }]}>
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="image-search" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>OCR Vision</Text>
                </View>
                <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="translate" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                    KO → {LANGUAGES.find((l) => l.code === selectedLang)?.flag}
                  </Text>
                </View>
                <View style={[styles.infoDivider, { backgroundColor: colors.border }]} />
                <View style={styles.infoItem}>
                  <MaterialCommunityIcons name="book-open-page-variant" size={18} color={colors.primary} />
                  <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{displayTotal} صفحة</Text>
                </View>
              </View>

              {hasRealPages && apiReady === false && (
                <View style={[styles.warnBox, { backgroundColor: "rgba(255,160,0,0.12)", borderColor: "#FFA000" }]}>
                  <MaterialCommunityIcons name="alert" size={15} color="#FFA000" />
                  <Text style={[styles.warnText, { color: "#FFA000" }]}>
                    مفتاح API غير مُعدَّ — وضع المحاكاة نشط.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.startBtn, { backgroundColor: colors.primary }]}
                onPress={handleStart}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="play-circle" size={20} color="#fff" />
                <Text style={styles.startBtnText}>بدء الترجمة</Text>
              </TouchableOpacity>
            </ScrollView>
          ) : (
            /* ── Reader ── */
            <View style={styles.readerContainer}>
              {/* Progress */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={[styles.pageNum, { color: colors.mutedForeground }]}>
                    {currentPage + 1} / {displayTotal}
                  </Text>
                  {isLoading && (
                    <View style={styles.processingBadge}>
                      <ActivityIndicator size={10} color={colors.primary} />
                      <Text style={[styles.processingText, { color: colors.primary }]}>
                        {hasRealPages && apiReady ? L.loading : "جارٍ الترجمة..."}
                      </Text>
                    </View>
                  )}
                  {/* Language switcher (compact) */}
                  <View style={styles.langMini}>
                    {LANGUAGES.map((lang) => (
                      <TouchableOpacity
                        key={lang.code}
                        onPress={() => { setSelectedLang(lang.code); Haptics.selectionAsync(); }}
                        style={[styles.langMiniBtn, selectedLang === lang.code && { backgroundColor: colors.primary }]}
                      >
                        <Text style={styles.langMiniFlag}>{lang.flag}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
                  <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${progress}%` }]} />
                </View>
              </View>

              {/* Page image or mock */}
              <View style={[styles.pageView, { backgroundColor: colors.background }]}>
                {hasRealPages && pageUrls?.[currentPage] ? (
                  <Image source={{ uri: pageUrls[currentPage] }} style={styles.pageImage} resizeMode="contain" />
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
              <View style={[styles.translationCard, {
                backgroundColor: colors.muted,
                borderColor: isError ? colors.destructive : colors.primary,
              }]}>
                <View style={styles.bubbleHeader}>
                  <MaterialCommunityIcons
                    name={isError ? "alert-circle" : isLoading ? "dots-horizontal" : "check-circle"}
                    size={14}
                    color={isError ? colors.destructive : isLoading ? colors.mutedForeground : colors.primary}
                  />
                  <Text style={[styles.bubbleLabel, { color: isError ? colors.destructive : colors.primary }]}>
                    {isError ? L.error : isLoading ? "..." : "الترجمة"}
                  </Text>
                  {isError && (
                    <TouchableOpacity onPress={handleRetry} style={styles.retryBtn}>
                      <Text style={[styles.retryText, { color: colors.primary }]}>إعادة المحاولة</Text>
                    </TouchableOpacity>
                  )}
                </View>
                <ScrollView style={styles.translationScroll} showsVerticalScrollIndicator={false}>
                  {isLoading ? (
                    <View style={styles.loadingRow}>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>{L.loading}</Text>
                    </View>
                  ) : isError ? (
                    <Text style={[styles.translatedText, { color: colors.destructive, writingDirection: "ltr" }]}>
                      {errorMsg}
                    </Text>
                  ) : currentTranslation ? (
                    <Text style={[
                      styles.translatedText,
                      { color: colors.foreground },
                      isRTL && styles.rtlText,
                    ]}>
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
                    onPress={handlePrev}
                    disabled={isLoading}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={18}
                      color={isLoading ? colors.mutedForeground : colors.foreground} />
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
                      {L.next}
                    </Text>
                    <MaterialCommunityIcons name="arrow-right" size={18}
                      color={isLoading ? colors.mutedForeground : "#fff"} />
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: "#2E7D32", flex: 1 }]}
                    onPress={handleClose}
                    activeOpacity={0.85}
                  >
                    <MaterialCommunityIcons name="check-circle" size={18} color="#fff" />
                    <Text style={styles.nextBtnText}>{L.done}</Text>
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
    maxHeight: height * 0.92,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    borderBottomWidth: 0.5,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  aiBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6,
  },
  aiBadgeText: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  headerTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  closeBtn: { padding: 4 },

  startContainer: { padding: 24, alignItems: "center", gap: 14 },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center" },
  startTitle: { fontSize: 22, fontFamily: "Inter_700Bold", textAlign: "center" },
  startDesc: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },

  langSelectorLabel: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start" },
  langSelectorTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  langRow: {
    flexDirection: "row",
    borderRadius: 14,
    overflow: "hidden",
    width: "100%",
    padding: 4,
    gap: 4,
  },
  langBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  langFlag: { fontSize: 16 },
  langLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },

  infoGrid: {
    flexDirection: "row",
    borderRadius: 12,
    overflow: "hidden",
    width: "100%",
  },
  infoItem: { flex: 1, alignItems: "center", gap: 5, paddingVertical: 12 },
  infoLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  infoDivider: { width: 0.5 },
  warnBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 12, borderRadius: 10, borderWidth: 1, width: "100%",
  },
  warnText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  startBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingVertical: 15, paddingHorizontal: 32,
    borderRadius: 14, width: "100%", justifyContent: "center",
  },
  startBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  readerContainer: { padding: 16, gap: 12 },
  progressSection: { gap: 7 },
  progressLabelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageNum: { fontSize: 12, fontFamily: "Inter_500Medium" },
  processingBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  processingText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  langMini: { flexDirection: "row", gap: 4 },
  langMiniBtn: {
    width: 26, height: 26, borderRadius: 6,
    alignItems: "center", justifyContent: "center",
  },
  langMiniFlag: { fontSize: 14 },
  progressBar: { height: 3, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },

  pageView: { borderRadius: 10, overflow: "hidden", height: 165, alignItems: "center", justifyContent: "center" },
  pageImage: { width: "100%", height: "100%" },
  mockPage: { width: "100%", padding: 20, gap: 16 },
  mockPanel: { gap: 10 },
  mockStrip: { height: 12, borderRadius: 6, width: "100%" },

  translationCard: {
    borderWidth: 1, borderRadius: 12, padding: 14, minHeight: 100, maxHeight: 185,
  },
  bubbleHeader: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 8 },
  bubbleLabel: { fontSize: 11, fontFamily: "Inter_700Bold", flex: 1, letterSpacing: 0.4 },
  retryBtn: { paddingHorizontal: 8, paddingVertical: 2 },
  retryText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  translationScroll: { flex: 1 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  loadingText: { fontSize: 13, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  translatedText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 23, fontStyle: "italic" },
  rtlText: { textAlign: "right", writingDirection: "rtl" },

  controls: { flexDirection: "row", gap: 10, alignItems: "center" },
  prevBtn: {
    width: 46, height: 46, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  nextBtn: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
});
