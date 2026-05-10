import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SectionHeader } from "@/components/SectionHeader";
import { ManhwaCardSkeleton } from "@/components/ManhwaSkeleton";
import { useApp } from "@/context/AppContext";
import { MANHWA_LIST } from "@/data/manhwa";
import { useColors } from "@/hooks/useColors";
import { useManhwaList, type ApiManhwa } from "@/hooks/useManhwaApi";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const COVER_COLORS = [
  "#1a0a0a", "#0a0a1a", "#0a1a0a",
  "#1a0a1a", "#0f0f1a", "#1a0f0a",
];

function CoverPlaceholder({ id, title }: { id: string; title: string }) {
  const colors = useColors();
  const colorIndex =
    id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COVER_COLORS.length;
  const initials = title.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();
  return (
    <View style={[styles.coverPlaceholder, { backgroundColor: COVER_COLORS[colorIndex] }]}>
      <Text style={[styles.coverInitials, { color: colors.primary }]}>{initials}</Text>
      <View style={[styles.coverAccent, { backgroundColor: colors.primary }]} />
    </View>
  );
}

function ManhwaCard({ manhwa }: { manhwa: ApiManhwa }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.card }]}
      onPress={() => router.push({ pathname: "/details", params: { id: manhwa.id } })}
      activeOpacity={0.8}
    >
      <View style={styles.cardCover}>
        {manhwa.cover ? (
          <Image source={{ uri: manhwa.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <CoverPlaceholder id={manhwa.id} title={manhwa.title} />
        )}
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={10} color="#FFD700" />
          <Text style={styles.ratingText}>{manhwa.rating.toFixed(1)}</Text>
        </View>
        {manhwa.status === "Ongoing" && (
          <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.statusText}>LIVE</Text>
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
          {manhwa.title}
        </Text>
        <Text style={[styles.cardMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {manhwa.genre[0] ?? "Manhwa"} · {manhwa.year}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function HeroSection({ manhwa }: { manhwa: ApiManhwa }) {
  const colors = useColors();
  const colorIndex =
    manhwa.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % COVER_COLORS.length;

  return (
    <TouchableOpacity
      style={[styles.hero, { backgroundColor: COVER_COLORS[colorIndex] }]}
      onPress={() => router.push({ pathname: "/details", params: { id: manhwa.id } })}
      activeOpacity={0.9}
    >
      {manhwa.cover ? (
        <Image source={{ uri: manhwa.cover }} style={[StyleSheet.absoluteFill, styles.heroCover]} resizeMode="cover" />
      ) : null}
      <View style={styles.heroGradient} />
      <View style={styles.heroContent}>
        <View style={[styles.heroBadge, { backgroundColor: colors.primary }]}>
          <MaterialCommunityIcons name="fire" size={12} color="#fff" />
          <Text style={styles.heroBadgeText}>FEATURED</Text>
        </View>
        <Text style={styles.heroTitle} numberOfLines={2}>{manhwa.title}</Text>
        <Text style={styles.heroMeta}>{manhwa.genre.slice(0, 3).join(" · ")}</Text>
        <View style={styles.heroStats}>
          <MaterialCommunityIcons name="star" size={14} color="#FFD700" />
          <Text style={styles.heroRating}>{manhwa.rating.toFixed(1)}</Text>
          <Text style={styles.heroDot}>·</Text>
          <Text style={styles.heroViews}>{manhwa.views} views</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, remainingAIChapters } = useApp();
  const isWeb = Platform.OS === "web";

  const { data, isLoading, isError, refetch, isRefetching } = useManhwaList(1, "followedCount");

  const manhwaList = data?.manhwa ?? [];
  const featured = manhwaList[0];
  const trending = manhwaList.slice(0, 6);
  const newUpdates = manhwaList.filter((m) => m.status === "Ongoing").slice(0, 6);
  const fallback = MANHWA_LIST;

  const topPadding = isWeb ? 67 : insets.top;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingTop: topPadding + 12, paddingBottom: isWeb ? 34 : 100 }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefetching}
          onRefresh={refetch}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.appName, { color: colors.primary }]}>YOMU AI</Text>
          <Text style={[styles.greeting, { color: colors.foreground }]}>Welcome back</Text>
        </View>
        <View style={styles.headerActions}>
          {user.plan === "free" && (
            <View style={[styles.aiCounter, { backgroundColor: colors.muted }]}>
              <MaterialCommunityIcons name="translate" size={13} color={colors.primary} />
              <Text style={[styles.aiCountText, { color: colors.foreground }]}>{remainingAIChapters}</Text>
            </View>
          )}
          {user.plan === "premium" && (
            <View style={[styles.premiumBadge, { backgroundColor: colors.gold }]}>
              <MaterialCommunityIcons name="crown" size={12} color="#000" />
            </View>
          )}
        </View>
      </View>

      {isLoading ? (
        <View style={[styles.heroSkeleton, { backgroundColor: colors.muted }]}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : isError ? (
        <HeroSection manhwa={{ ...fallback[0], chapters: [] } as any} />
      ) : featured ? (
        <HeroSection manhwa={featured} />
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Trending Now" />
        {isLoading ? (
          <FlatList
            data={[1, 2, 3]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item)}
            renderItem={() => <View style={{ marginRight: 10 }}><ManhwaCardSkeleton /></View>}
            scrollEnabled={false}
          />
        ) : (
          <FlatList
            data={trending.length ? trending : (fallback.slice(0, 5).map(m => ({ ...m, chapters: [] })) as any)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ marginRight: 10 }}>
                <ManhwaCard manhwa={item} />
              </View>
            )}
            scrollEnabled={!!trending.length}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title="New Updates" />
        {isLoading ? (
          <FlatList
            data={[1, 2, 3]}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => String(item)}
            renderItem={() => <View style={{ marginRight: 10 }}><ManhwaCardSkeleton /></View>}
            scrollEnabled={false}
          />
        ) : (
          <FlatList
            data={newUpdates.length ? newUpdates : (fallback.filter(m => m.status === "Ongoing").slice(0, 5).map(m => ({ ...m, chapters: [] })) as any)}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ marginRight: 10 }}>
                <ManhwaCard manhwa={item} />
              </View>
            )}
            scrollEnabled={!!newUpdates.length}
          />
        )}
      </View>

      <View style={styles.section}>
        <SectionHeader title={isError ? "Popular Manhwa" : "All Manhwa"} />
        {isLoading
          ? [1, 2, 3, 4, 5].map((i) => <ManhwaListRowSkeleton key={i} />)
          : (manhwaList.length ? manhwaList : fallback.map(m => ({ ...m, chapters: [] }))).map((m) => (
              <ManhwaListRow key={m.id} manhwa={m as ApiManhwa} />
            ))}
      </View>
    </ScrollView>
  );
}

function ManhwaListRowSkeleton() {
  const colors = useColors();
  return (
    <View style={[styles.listRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.listCover, { backgroundColor: colors.muted }]} />
      <View style={{ flex: 1, gap: 8 }}>
        <View style={[styles.skeletonLine, { backgroundColor: colors.muted, width: "75%" }]} />
        <View style={[styles.skeletonLine, { backgroundColor: colors.muted, width: "50%" }]} />
      </View>
    </View>
  );
}

function ManhwaListRow({ manhwa }: { manhwa: ApiManhwa }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.listRow, { borderBottomColor: colors.border }]}
      onPress={() => router.push({ pathname: "/details", params: { id: manhwa.id } })}
      activeOpacity={0.8}
    >
      <View style={[styles.listCover, { backgroundColor: colors.muted }]}>
        {manhwa.cover ? (
          <Image source={{ uri: manhwa.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" borderRadius={6} />
        ) : (
          <Text style={[styles.listInitials, { color: colors.primary }]}>
            {manhwa.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
          </Text>
        )}
      </View>
      <View style={styles.listInfo}>
        <Text style={[styles.listTitle, { color: colors.foreground }]} numberOfLines={1}>{manhwa.title}</Text>
        <Text style={[styles.listMeta, { color: colors.mutedForeground }]}>{manhwa.author}</Text>
        <View style={styles.listGenres}>
          {manhwa.genre.slice(0, 2).map((g) => (
            <View key={g} style={[styles.genreTag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.genreText, { color: colors.mutedForeground }]}>{g}</Text>
            </View>
          ))}
        </View>
      </View>
      <View style={styles.listRight}>
        <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
        <Text style={[styles.listRating, { color: "#FFD700" }]}>{manhwa.rating.toFixed(1)}</Text>
        <Text style={[styles.listStatus, { color: manhwa.status === "Ongoing" ? colors.primary : colors.mutedForeground }]}>
          {manhwa.status}
        </Text>
      </View>
    </TouchableOpacity>
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
  appName: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 3 },
  greeting: { fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 2 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  aiCounter: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20,
  },
  aiCountText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  premiumBadge: {
    width: 28, height: 28, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  heroSkeleton: {
    height: 190, borderRadius: 14, alignItems: "center",
    justifyContent: "center", marginBottom: 28,
  },
  hero: {
    height: 200, borderRadius: 14, overflow: "hidden",
    marginBottom: 28, justifyContent: "flex-end",
  },
  heroCover: { borderRadius: 14 },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  heroContent: { padding: 16, gap: 6 },
  heroBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start",
  },
  heroBadgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  heroTitle: { color: "#fff", fontSize: 20, fontFamily: "Inter_700Bold", lineHeight: 26 },
  heroMeta: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular" },
  heroStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  heroRating: { color: "#FFD700", fontSize: 13, fontFamily: "Inter_700Bold" },
  heroDot: { color: "rgba(255,255,255,0.4)", fontSize: 13 },
  heroViews: { color: "rgba(255,255,255,0.6)", fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { marginBottom: 28 },
  card: { borderRadius: 10, overflow: "hidden", marginBottom: 12 },
  cardCover: { width: "100%", height: CARD_WIDTH * 1.2, position: "relative", overflow: "hidden" },
  coverPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center" },
  coverInitials: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 2 },
  coverAccent: { position: "absolute", bottom: 0, left: 0, right: 0, height: 3 },
  ratingBadge: {
    position: "absolute", top: 6, left: 6,
    backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 4,
    flexDirection: "row", alignItems: "center", gap: 2,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  ratingText: { color: "#FFD700", fontSize: 10, fontFamily: "Inter_700Bold" },
  statusBadge: { position: "absolute", top: 6, right: 6, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  statusText: { color: "#fff", fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  cardInfo: { padding: 8, gap: 2 },
  cardTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", lineHeight: 16 },
  cardMeta: { fontSize: 10, fontFamily: "Inter_400Regular" },
  listRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5,
  },
  listCover: {
    width: 52, height: 70, borderRadius: 6,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  listInitials: { fontSize: 16, fontFamily: "Inter_700Bold" },
  listInfo: { flex: 1, gap: 3 },
  listTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  listMeta: { fontSize: 12, fontFamily: "Inter_400Regular" },
  listGenres: { flexDirection: "row", gap: 4 },
  genreTag: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  genreText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  listRight: { alignItems: "flex-end", gap: 4 },
  listRating: { fontSize: 13, fontFamily: "Inter_700Bold" },
  listStatus: { fontSize: 10, fontFamily: "Inter_500Medium" },
  skeletonLine: { height: 10, borderRadius: 5 },
});
