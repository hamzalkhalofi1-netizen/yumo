import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ManhwaRowSkeleton } from "@/components/ManhwaSkeleton";
import { useColors } from "@/hooks/useColors";
import { MANHWA_LIST, GENRES } from "@/data/manhwa";
import { useManhwaList, useManhwaSearch, type ApiManhwa } from "@/hooks/useManhwaApi";

function ResultRow({ manhwa }: { manhwa: ApiManhwa }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={() => router.push({ pathname: "/details", params: { id: manhwa.id } })}
      activeOpacity={0.8}
    >
      <View style={[styles.cover, { backgroundColor: colors.muted }]}>
        {manhwa.cover ? (
          <Image source={{ uri: manhwa.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" borderRadius={6} />
        ) : (
          <Text style={[styles.initials, { color: colors.primary }]}>
            {manhwa.title.split(" ").slice(0, 2).map((w) => w[0]).join("")}
          </Text>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>{manhwa.title}</Text>
        <Text style={[styles.author, { color: colors.mutedForeground }]}>{manhwa.author}</Text>
        <View style={styles.tags}>
          {manhwa.genre.slice(0, 2).map((g) => (
            <View key={g} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{g}</Text>
            </View>
          ))}
        </View>
        <View style={styles.ratingRow}>
          <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
          <Text style={[styles.rating, { color: "#FFD700" }]}>{manhwa.rating.toFixed(1)}</Text>
          <View style={[styles.statusDot, { backgroundColor: manhwa.status === "Ongoing" ? colors.primary : colors.mutedForeground }]} />
          <Text style={[styles.status, { color: manhwa.status === "Ongoing" ? colors.primary : colors.mutedForeground }]}>
            {manhwa.status}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const [query, setQuery] = useState("");
  const [activeGenre, setActiveGenre] = useState("All");
  const topPadding = isWeb ? 67 : insets.top;

  const isSearching = query.length > 0 || activeGenre !== "All";

  const listQuery = useManhwaList(1, "followedCount");
  const searchQuery = useManhwaSearch(query, activeGenre);

  const isLoading = isSearching ? searchQuery.isLoading : listQuery.isLoading;
  const data = isSearching
    ? (searchQuery.data?.manhwa ?? [])
    : (listQuery.data?.manhwa ?? []);

  const fallback = MANHWA_LIST.filter((m) => {
    const matchQuery = !query || m.title.toLowerCase().includes(query.toLowerCase());
    const matchGenre = activeGenre === "All" || m.genre.includes(activeGenre);
    return matchQuery && matchGenre;
  }).map((m) => ({ ...m, chapters: [] })) as unknown as ApiManhwa[];

  const displayData = data.length > 0 ? data : (isLoading ? [] : fallback);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <MaterialCommunityIcons name="magnify" size={20} color={colors.mutedForeground} />
          <TextInput
            style={[styles.input, { color: colors.foreground }]}
            placeholder="Search manhwa, author..."
            placeholderTextColor={colors.mutedForeground}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <MaterialCommunityIcons name="close-circle" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <FlatList
        data={GENRES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item}
        style={styles.genreList}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.genreChip,
              {
                backgroundColor: activeGenre === item ? colors.primary : colors.muted,
                borderColor: activeGenre === item ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setActiveGenre(item)}
          >
            <Text style={[styles.genreChipText, { color: activeGenre === item ? "#fff" : colors.mutedForeground }]}>
              {item}
            </Text>
          </TouchableOpacity>
        )}
      />

      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.results, { paddingBottom: isWeb ? 34 : 100 }]}
        ListHeaderComponent={
          isLoading ? (
            <View>
              {[1, 2, 3, 4, 5].map((i) => (
                <View key={i} style={{ paddingHorizontal: 16 }}>
                  <ManhwaRowSkeleton />
                </View>
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <MaterialCommunityIcons name="book-search-outline" size={48} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No results found</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 16 }}>
            <ResultRow manhwa={item} />
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 12 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  genreList: { maxHeight: 44, marginBottom: 16 },
  genreChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  genreChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  results: { paddingTop: 4 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingVertical: 12, borderBottomWidth: 0.5,
  },
  cover: {
    width: 56, height: 76, borderRadius: 6,
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  initials: { fontSize: 18, fontFamily: "Inter_700Bold" },
  info: { flex: 1, gap: 3 },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  author: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tags: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  tag: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  tagText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  rating: { fontSize: 12, fontFamily: "Inter_700Bold" },
  statusDot: { width: 4, height: 4, borderRadius: 2 },
  status: { fontSize: 11, fontFamily: "Inter_500Medium" },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
});
