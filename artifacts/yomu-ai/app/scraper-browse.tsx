import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useDiscoverSource, type ScrapedManhwaItem } from "@/hooks/useScraperApi";

function ManhwaItem({ item }: { item: ScrapedManhwaItem }) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.item, { backgroundColor: colors.card }]}
      onPress={() =>
        router.push({ pathname: "/scraper-detail", params: { url: item.link, title: item.title } })
      }
      activeOpacity={0.8}
    >
      <View style={[styles.cover, { backgroundColor: colors.muted }]}>
        {item.cover ? (
          <Image source={{ uri: item.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" borderRadius={8} />
        ) : (
          <View style={styles.noCover}>
            <MaterialCommunityIcons name="image-off" size={22} color={colors.mutedForeground} />
          </View>
        )}
      </View>
      <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={3}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
}

export default function ScraperBrowseScreen() {
  const { url, name } = useLocalSearchParams<{ url: string; name: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const topPadding = isWeb ? 67 : insets.top;

  const { data, isLoading, isError, error, refetch, isRefetching } = useDiscoverSource(url, true);

  const manhwa = data?.manhwa ?? [];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPadding + 12 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {name ?? data?.siteName ?? "Browsing Source"}
          </Text>
          <Text style={[styles.headerUrl, { color: colors.mutedForeground }]} numberOfLines={1}>
            {url}
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.reloadBtn, { backgroundColor: colors.muted }]}
          onPress={() => refetch()}
        >
          <MaterialCommunityIcons name="refresh" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Scraping {name ?? url}...
          </Text>
          <Text style={[styles.loadingSubtext, { color: colors.mutedForeground }]}>
            Fetching content dynamically
          </Text>
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="alert-circle-outline" size={52} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>Scraping Failed</Text>
          <Text style={[styles.errorDesc, { color: colors.mutedForeground }]}>
            {(error as Error)?.message ?? "Could not fetch content from this source."}
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => refetch()}
          >
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : manhwa.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="book-search-outline" size={52} color={colors.mutedForeground} />
          <Text style={[styles.errorTitle, { color: colors.foreground }]}>No Content Found</Text>
          <Text style={[styles.errorDesc, { color: colors.mutedForeground }]}>
            The scraper couldn't detect manhwa listings on this page. Try a different URL or a category/listing page on the site.
          </Text>
          <TouchableOpacity
            style={[styles.retryBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.back()}
          >
            <Text style={styles.retryBtnText}>Change Source</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={manhwa}
          numColumns={2}
          keyExtractor={(item, idx) => `${item.link}_${idx}`}
          contentContainerStyle={[styles.grid, { paddingBottom: isWeb ? 34 : 100 }]}
          columnWrapperStyle={styles.row}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListHeaderComponent={
            <View style={[styles.resultBanner, { backgroundColor: colors.muted }]}>
              <MaterialCommunityIcons name="check-circle" size={14} color="#4CAF50" />
              <Text style={[styles.resultBannerText, { color: colors.foreground }]}>
                {manhwa.length} titles scraped live from {data?.siteName ?? name}
              </Text>
            </View>
          }
          renderItem={({ item }) => <ManhwaItem item={item} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingBottom: 14,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerInfo: { flex: 1 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerUrl: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 2 },
  reloadBtn: {
    width: 34, height: 34, borderRadius: 10,
    alignItems: "center", justifyContent: "center",
  },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 12 },
  loadingText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  loadingSubtext: { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  errorDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  retryBtn: { paddingVertical: 12, paddingHorizontal: 28, borderRadius: 10, marginTop: 4 },
  retryBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  grid: { padding: 12 },
  row: { gap: 12, marginBottom: 12 },
  item: { flex: 1, borderRadius: 10, overflow: "hidden", gap: 8, padding: 8 },
  cover: { width: "100%", height: 160, borderRadius: 8, overflow: "hidden" },
  noCover: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 16 },
  resultBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    padding: 10, borderRadius: 8, marginBottom: 12,
  },
  resultBannerText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
