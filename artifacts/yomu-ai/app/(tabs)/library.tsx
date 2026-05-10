import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

type Tab = "favorites" | "history";

export default function LibraryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { favorites, readingHistory, removeFromFavorites } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>("favorites");

  const topPadding = isWeb ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Library</Text>
        <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === "favorites" && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab("favorites")}
          >
            <Text style={[styles.tabText, { color: activeTab === "favorites" ? "#fff" : colors.mutedForeground }]}>
              Favorites
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === "history" && { backgroundColor: colors.primary }]}
            onPress={() => setActiveTab("history")}
          >
            <Text style={[styles.tabText, { color: activeTab === "history" ? "#fff" : colors.mutedForeground }]}>
              History
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {activeTab === "favorites" && (
        <FlatList
          data={favorites}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 34 : 100 }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="heart-outline" size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Favorites Yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Add manhwa to your favorites from the details page
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/details", params: { id: item.id } })}
              activeOpacity={0.8}
            >
              <View style={[styles.cover, { backgroundColor: colors.muted }]}>
                <Text style={[styles.initials, { color: colors.primary }]}>
                  {item.title.split(" ").slice(0, 2).map((w: string) => w[0]).join("")}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                  {item.genre}
                </Text>
                <View style={styles.ratingRow}>
                  <MaterialCommunityIcons name="star" size={12} color="#FFD700" />
                  <Text style={[styles.rating, { color: "#FFD700" }]}>{item.rating}</Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => removeFromFavorites(item.id)}
                style={styles.removeBtn}
              >
                <MaterialCommunityIcons name="heart" size={20} color={colors.primary} />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
        />
      )}

      {activeTab === "history" && (
        <FlatList
          data={readingHistory}
          keyExtractor={(item, idx) => `${item.manhwaId}_${idx}`}
          contentContainerStyle={[styles.list, { paddingBottom: isWeb ? 34 : 100 }]}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="book-open-outline" size={52} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No History Yet</Text>
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Start reading to track your progress
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push({ pathname: "/details", params: { id: item.manhwaId } })}
              activeOpacity={0.8}
            >
              <View style={[styles.cover, { backgroundColor: colors.muted }]}>
                <Text style={[styles.initials, { color: colors.primary }]}>
                  {item.manhwaTitle.split(" ").slice(0, 2).map((w: string) => w[0]).join("")}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {item.manhwaTitle}
                </Text>
                <Text style={[styles.itemMeta, { color: colors.mutedForeground }]}>
                  Chapter {item.chapterNumber}
                </Text>
                <Text style={[styles.itemDate, { color: colors.mutedForeground }]}>
                  {item.readAt}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 16,
  },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
  },
  tabs: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 8,
  },
  tabText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  list: {
    padding: 16,
    gap: 12,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    marginBottom: 10,
  },
  cover: {
    width: 56,
    height: 76,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  initials: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  info: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  itemMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  itemDate: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rating: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  removeBtn: { padding: 4 },
  empty: {
    alignItems: "center",
    paddingTop: 80,
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
});
