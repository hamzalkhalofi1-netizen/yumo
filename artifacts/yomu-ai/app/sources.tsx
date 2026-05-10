import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSources, type ManhwaSource } from "@/context/SourcesContext";
import { useColors } from "@/hooks/useColors";
import { useTestSource, useDiscoverMutation, type ScrapedManhwaItem } from "@/hooks/useScraperApi";

const PRESET_SOURCES = [
  { name: "MangaKatana", url: "https://mangakatana.com/manhwa" },
  { name: "Manhwa18", url: "https://manhwa18.com" },
  { name: "MangaFreak", url: "https://w12.mangafreak.net" },
  { name: "ManhwaTop", url: "https://manhwatop.com" },
  { name: "KissManga", url: "https://kissmanga.in/manhwa" },
];

function SourceCard({ source, isActive, onPress, onDelete }: {
  source: ManhwaSource;
  isActive: boolean;
  onPress: () => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[
        styles.sourceCard,
        {
          backgroundColor: colors.card,
          borderColor: isActive ? colors.primary : colors.border,
          borderWidth: isActive ? 1.5 : 0.5,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.sourceIcon, { backgroundColor: isActive ? colors.primary : colors.muted }]}>
        <MaterialCommunityIcons
          name="web"
          size={18}
          color={isActive ? "#fff" : colors.mutedForeground}
        />
      </View>
      <View style={styles.sourceInfo}>
        <Text style={[styles.sourceName, { color: colors.foreground }]} numberOfLines={1}>
          {source.name}
        </Text>
        <Text style={[styles.sourceUrl, { color: colors.mutedForeground }]} numberOfLines={1}>
          {source.url}
        </Text>
        <View style={styles.sourceMeta}>
          {source.manhwaCount > 0 && (
            <Text style={[styles.sourceCount, { color: colors.primary }]}>
              {source.manhwaCount} found
            </Text>
          )}
          <View style={[styles.statusDot, { backgroundColor: source.lastTestedOk ? "#4CAF50" : colors.mutedForeground }]} />
        </View>
      </View>
      {isActive && (
        <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="check" size={12} color="#fff" />
        </View>
      )}
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <MaterialCommunityIcons name="close" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

function PreviewItem({ item, onAdd }: { item: ScrapedManhwaItem; onAdd: () => void }) {
  const colors = useColors();
  return (
    <View style={[styles.previewItem, { backgroundColor: colors.card }]}>
      {item.cover ? (
        <Image source={{ uri: item.cover }} style={styles.previewCover} resizeMode="cover" />
      ) : (
        <View style={[styles.previewCover, { backgroundColor: colors.muted, alignItems: "center", justifyContent: "center" }]}>
          <MaterialCommunityIcons name="image-off" size={16} color={colors.mutedForeground} />
        </View>
      )}
      <Text style={[styles.previewTitle, { color: colors.foreground }]} numberOfLines={2}>
        {item.title}
      </Text>
    </View>
  );
}

export default function SourcesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { sources, activeSource, setActiveSource, addSource, removeSource, updateSourceCount } = useSources();

  const [url, setUrl] = useState("");
  const [customName, setCustomName] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [previewResults, setPreviewResults] = useState<ScrapedManhwaItem[]>([]);
  const [previewSiteName, setPreviewSiteName] = useState("");

  const testMutation = useTestSource();
  const discoverMutation = useDiscoverMutation();

  const topPadding = isWeb ? 67 : insets.top;

  const handleTest = async () => {
    if (!url.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setPreviewResults([]);
    try {
      const result = await testMutation.mutateAsync(url.trim());
      if (!result.reachable) {
        Alert.alert("Unreachable", result.error ?? "Cannot connect to this URL.");
        return;
      }
      // Now discover
      const discovered = await discoverMutation.mutateAsync(url.trim());
      setPreviewResults(discovered.manhwa);
      setPreviewSiteName(discovered.siteName || customName || new URL(url.trim()).hostname);
      if (!customName) setCustomName(discovered.siteName || new URL(url.trim()).hostname);
    } catch (err: any) {
      Alert.alert("Test Failed", err.message ?? "Could not reach the URL. Check the address and try again.");
    }
  };

  const handleAddSource = async () => {
    if (!url.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const name = customName.trim() || new URL(url.trim()).hostname;
    const source = await addSource(name, url.trim(), previewResults.length);
    setActiveSource(source);
    setUrl("");
    setCustomName("");
    setPreviewResults([]);
    setShowAdd(false);
  };

  const handleSelectPreset = (preset: { name: string; url: string }) => {
    setUrl(preset.url);
    setCustomName(preset.name);
    setShowAdd(true);
  };

  const handleBrowseSource = (source: ManhwaSource) => {
    setActiveSource(source);
    router.push({ pathname: "/scraper-browse", params: { sourceId: source.id, url: source.url, name: source.name } });
  };

  const handleDeleteSource = (source: ManhwaSource) => {
    Alert.alert("Remove Source", `Remove "${source.name}" from your sources?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => removeSource(source.id) },
    ]);
  };

  const isBusy = testMutation.isPending || discoverMutation.isPending;

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Manga Sources</Text>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={() => setShowAdd((v) => !v)}
        >
          <MaterialCommunityIcons name={showAdd ? "minus" : "plus"} size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: isWeb ? 34 : 100 }}>
        {showAdd && (
          <View style={[styles.addPanel, { backgroundColor: colors.card }]}>
            <Text style={[styles.addTitle, { color: colors.foreground }]}>Add New Source</Text>
            <Text style={[styles.addDesc, { color: colors.mutedForeground }]}>
              Enter any manhwa website URL. The scraper will dynamically detect content from that domain.
            </Text>

            <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="link" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="https://example-manhwa-site.com"
                placeholderTextColor={colors.mutedForeground}
                value={url}
                onChangeText={setUrl}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
              />
            </View>

            <View style={[styles.inputRow, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <MaterialCommunityIcons name="label-outline" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="Source name (optional)"
                placeholderTextColor={colors.mutedForeground}
                value={customName}
                onChangeText={setCustomName}
              />
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[styles.testBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={handleTest}
                disabled={isBusy || !url.trim()}
                activeOpacity={0.8}
              >
                {isBusy ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons name="radar" size={16} color={colors.primary} />
                )}
                <Text style={[styles.testBtnText, { color: isBusy ? colors.mutedForeground : colors.primary }]}>
                  {isBusy ? "Scanning..." : "Test & Preview"}
                </Text>
              </TouchableOpacity>

              {previewResults.length > 0 && (
                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleAddSource}
                  activeOpacity={0.85}
                >
                  <MaterialCommunityIcons name="plus-circle" size={16} color="#fff" />
                  <Text style={styles.saveBtnText}>Add Source</Text>
                </TouchableOpacity>
              )}
            </View>

            {previewResults.length > 0 && (
              <View style={styles.preview}>
                <View style={[styles.previewHeader, { borderBottomColor: colors.border }]}>
                  <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
                  <Text style={[styles.previewHeaderText, { color: colors.foreground }]}>
                    Found {previewResults.length} titles on {previewSiteName}
                  </Text>
                </View>
                <FlatList
                  data={previewResults.slice(0, 8)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, idx) => `${item.link}_${idx}`}
                  contentContainerStyle={{ gap: 8, paddingVertical: 10 }}
                  renderItem={({ item }) => (
                    <PreviewItem item={item} onAdd={() => {}} />
                  )}
                  scrollEnabled
                />
              </View>
            )}

            {testMutation.isError && (
              <View style={[styles.errorBox, { backgroundColor: "rgba(255,82,82,0.1)", borderColor: colors.destructive }]}>
                <MaterialCommunityIcons name="alert-circle" size={14} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>
                  {(testMutation.error as Error)?.message ?? "Connection failed"}
                </Text>
              </View>
            )}
          </View>
        )}

        {!showAdd && sources.length === 0 && (
          <View style={styles.presetSection}>
            <Text style={[styles.presetTitle, { color: colors.foreground }]}>Quick Add</Text>
            <Text style={[styles.presetDesc, { color: colors.mutedForeground }]}>
              Tap a preset to auto-fill and test it, or add any custom URL above.
            </Text>
            {PRESET_SOURCES.map((p) => (
              <TouchableOpacity
                key={p.url}
                style={[styles.presetItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => handleSelectPreset(p)}
                activeOpacity={0.8}
              >
                <View style={[styles.presetIcon, { backgroundColor: colors.muted }]}>
                  <MaterialCommunityIcons name="web" size={16} color={colors.primary} />
                </View>
                <View style={styles.presetInfo}>
                  <Text style={[styles.presetName, { color: colors.foreground }]}>{p.name}</Text>
                  <Text style={[styles.presetUrl, { color: colors.mutedForeground }]} numberOfLines={1}>{p.url}</Text>
                </View>
                <MaterialCommunityIcons name="plus-circle-outline" size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {sources.length > 0 && (
          <View style={styles.sourcesSection}>
            <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>YOUR SOURCES</Text>
            {sources.map((source) => (
              <SourceCard
                key={source.id}
                source={source}
                isActive={activeSource?.id === source.id}
                onPress={() => handleBrowseSource(source)}
                onDelete={() => handleDeleteSource(source)}
              />
            ))}
          </View>
        )}

        {sources.length === 0 && showAdd && (
          <View style={styles.presetSection}>
            <Text style={[styles.presetTitle, { color: colors.foreground }]}>Suggested Sites</Text>
            {PRESET_SOURCES.map((p) => (
              <TouchableOpacity
                key={p.url}
                style={[styles.presetItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => { setUrl(p.url); setCustomName(p.name); }}
                activeOpacity={0.8}
              >
                <View style={[styles.presetIcon, { backgroundColor: colors.muted }]}>
                  <MaterialCommunityIcons name="web" size={16} color={colors.primary} />
                </View>
                <View style={styles.presetInfo}>
                  <Text style={[styles.presetName, { color: colors.foreground }]}>{p.name}</Text>
                  <Text style={[styles.presetUrl, { color: colors.mutedForeground }]} numberOfLines={1}>{p.url}</Text>
                </View>
                <MaterialCommunityIcons name="arrow-up-right" size={18} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  addPanel: {
    margin: 16, borderRadius: 14, padding: 16, gap: 12,
  },
  addTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  addDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  input: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", gap: 10 },
  testBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 11, borderRadius: 10, borderWidth: 1,
  },
  testBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  saveBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 11, borderRadius: 10,
  },
  saveBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  preview: { gap: 4 },
  previewHeader: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingBottom: 8, borderBottomWidth: 0.5,
  },
  previewHeaderText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  previewItem: {
    width: 100, borderRadius: 8, overflow: "hidden", gap: 6, padding: 6,
  },
  previewCover: { width: "100%", height: 130, borderRadius: 6 },
  previewTitle: { fontSize: 11, fontFamily: "Inter_500Medium", lineHeight: 15 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 10, borderRadius: 8, borderWidth: 1,
  },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  sourcesSection: { paddingHorizontal: 16, gap: 10 },
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 4, marginTop: 8,
  },
  sourceCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 12,
  },
  sourceIcon: {
    width: 38, height: 38, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  sourceInfo: { flex: 1, gap: 3 },
  sourceName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sourceUrl: { fontSize: 11, fontFamily: "Inter_400Regular" },
  sourceMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  sourceCount: { fontSize: 11, fontFamily: "Inter_500Medium" },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadge: {
    width: 20, height: 20, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  deleteBtn: { padding: 4 },
  presetSection: { padding: 16, gap: 12 },
  presetTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  presetDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  presetItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 12, borderRadius: 12, borderWidth: 0.5,
  },
  presetIcon: {
    width: 36, height: 36, borderRadius: 8,
    alignItems: "center", justifyContent: "center",
  },
  presetInfo: { flex: 1 },
  presetName: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  presetUrl: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
});
