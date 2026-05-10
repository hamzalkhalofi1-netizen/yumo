import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ManhwaCard } from "@/components/ManhwaCard";
import { SectionHeader } from "@/components/SectionHeader";
import { useApp } from "@/context/AppContext";
import { MANHWA_LIST, NEW_UPDATES, TRENDING } from "@/data/manhwa";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

function HeroSection() {
  const colors = useColors();
  const featured = MANHWA_LIST[0];

  const HERO_COLORS = ["#1a0505", "#050515", "#051505"];
  const colorIndex = featured.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % HERO_COLORS.length;

  return (
    <TouchableOpacity
      style={[styles.hero, { backgroundColor: HERO_COLORS[colorIndex] }]}
      onPress={() => router.push({ pathname: "/details", params: { id: featured.id } })}
      activeOpacity={0.9}
    >
      <View style={styles.heroOverlay}>
        <View style={[styles.heroBadge, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="fire" size={12} color="#fff" />
          <Text style={styles.heroBadgeText}>FEATURED</Text>
        </View>
        <Text style={[styles.heroTitle, { color: "#fff" }]}>{featured.title}</Text>
        <Text style={[styles.heroMeta, { color: "rgba(255,255,255,0.6)" }]}>
          {featured.genre.join(" · ")}
        </Text>
        <View style={styles.heroStats}>
          <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
          <Text style={[styles.heroRating, { color: "#FFD700" }]}>{featured.rating}</Text>
          <Text style={[styles.heroDivider, { color: "rgba(255,255,255,0.3)" }]}>·</Text>
          <Text style={[styles.heroViews, { color: "rgba(255,255,255,0.6)" }]}>
            {featured.views} views
          </Text>
        </View>
      </View>
      <View style={styles.heroArt}>
        <Text style={[styles.heroInitials, { color: colors.primary }]}>
          {featured.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, remainingAIChapters } = useApp();
  const isWeb = Platform.OS === "web";

  const topPadding = isWeb ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding + 12, paddingBottom: isWeb ? 34 : 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.appName, { color: colors.primary }]}>YOMU AI</Text>
          <Text style={[styles.greeting, { color: colors.foreground }]}>
            Welcome back
          </Text>
        </View>
        <View style={styles.headerActions}>
          {user.plan === "free" && (
            <View style={[styles.aiCounter, { backgroundColor: colors.muted }]}>
              <MaterialCommunityIcons name="translate" size={13} color={colors.primary} />
              <Text style={[styles.aiCountText, { color: colors.foreground }]}>
                {remainingAIChapters}
              </Text>
            </View>
          )}
          {user.plan === "premium" && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.gold }]}>
              <MaterialCommunityIcons name="crown" size={12} color="#000" />
            </View>
          )}
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/notifications" as any)}
            style={[styles.notifBtn, { backgroundColor: colors.muted }]}
          >
            <MaterialCommunityIcons name="bell-outline" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>
      </View>

      <HeroSection />

      <View style={styles.section}>
        <SectionHeader title="Trending Now" />
        <FlatList
          data={TRENDING}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ManhwaCard manhwa={item} />}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          scrollEnabled={!!TRENDING.length}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="New Updates" />
        <FlatList
          data={NEW_UPDATES.slice(0, 4)}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <ManhwaCard manhwa={item} />}
          ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
          scrollEnabled={!!NEW_UPDATES.length}
        />
      </View>

      <View style={styles.section}>
        <SectionHeader title="All Manhwa" />
        {MANHWA_LIST.map((m) => (
          <TouchableOpacity
            key={m.id}
            style={[styles.listRow, { borderBottomColor: colors.border }]}
            onPress={() => router.push({ pathname: "/details", params: { id: m.id } })}
            activeOpacity={0.8}
          >
            <View style={[styles.listCover, { backgroundColor: colors.muted }]}>
              <Text style={[styles.listInitials, { color: colors.primary }]}>
                {m.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
              </Text>
            </View>
            <View style={styles.listInfo}>
              <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={1}>
                {m.title}
              </Text>
              <Text style={[styles.listMeta, { color: colors.mutedForeground }]}>
                {m.author} · Ch.{m.chapters.length}
              </Text>
              <View style={styles.listGenres}>
                {m.genre.slice(0, 2).map((g) => (
                  <View key={g} style={[styles.genreTag, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.genreText, { color: colors.mutedForeground }]}>{g}</Text>
                  </View>
                ))}
              </View>
            </View>
            <View style={styles.listRight}>
              <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
              <Text style={[styles.listRating, { color: "#FFD700" }]}>{m.rating}</Text>
              <Text style={[styles.listStatus, { color: m.status === "Ongoing" ? colors.primary : colors.mutedForeground }]}>
                {m.status}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  appName: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  greeting: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  aiCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  aiCountText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  premiumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  hero: {
    height: 190,
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 28,
    flexDirection: "row",
    alignItems: "flex-end",
    padding: 16,
    position: "relative",
  },
  heroOverlay: {
    flex: 1,
    gap: 6,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  heroBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  heroTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    lineHeight: 26,
  },
  heroMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  heroStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  heroRating: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  heroDivider: {
    fontSize: 13,
  },
  heroViews: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  heroArt: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: "rgba(229,57,53,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(229,57,53,0.3)",
  },
  heroInitials: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  section: {
    marginBottom: 28,
  },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  listCover: {
    width: 52,
    height: 70,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  listInitials: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  listInfo: {
    flex: 1,
    gap: 3,
  },
  listTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  listMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  listGenres: {
    flexDirection: "row",
    gap: 4,
  },
  genreTag: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  genreText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  listRight: {
    alignItems: "flex-end",
    gap: 4,
  },
  listRating: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  listStatus: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
});
