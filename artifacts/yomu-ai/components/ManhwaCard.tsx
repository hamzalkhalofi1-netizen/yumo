import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { Manhwa } from "@/data/manhwa";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

const COVER_COLORS = [
  "#1a0a0a",
  "#0a0a1a",
  "#0a1a0a",
  "#1a0a1a",
  "#0f0f1a",
  "#1a0f0a",
  "#0a1a1a",
  "#1a1a0a",
];

function CoverPlaceholder({ manhwaId, title }: { manhwaId: string; title: string }) {
  const colors = useColors();
  const colorIndex =
    manhwaId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
    COVER_COLORS.length;
  const bgColor = COVER_COLORS[colorIndex];
  const initials = title
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();

  return (
    <View style={[styles.coverPlaceholder, { backgroundColor: bgColor }]}>
      <Text style={[styles.coverInitials, { color: colors.primary }]}>
        {initials}
      </Text>
      <View style={[styles.coverAccent, { backgroundColor: colors.primary }]} />
    </View>
  );
}

interface Props {
  manhwa: Manhwa;
  size?: "normal" | "large" | "small";
}

export function ManhwaCard({ manhwa, size = "normal" }: Props) {
  const colors = useColors();
  const cardWidth = size === "large" ? width - 32 : size === "small" ? 120 : CARD_WIDTH;
  const cardHeight = size === "large" ? 200 : size === "small" ? 170 : CARD_WIDTH * 1.45;

  return (
    <TouchableOpacity
      style={[styles.card, { width: cardWidth, backgroundColor: colors.card }]}
      onPress={() => router.push({ pathname: "/details", params: { id: manhwa.id } })}
      activeOpacity={0.8}
    >
      <View style={[styles.cover, { height: size === "large" ? 140 : cardHeight - 60 }]}>
        {manhwa.cover ? (
          <Image source={{ uri: manhwa.cover }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          <CoverPlaceholder manhwaId={manhwa.id} title={manhwa.title} />
        )}
        <View style={styles.ratingBadge}>
          <MaterialCommunityIcons name="star" size={10} color="#FFD700" />
          <Text style={styles.ratingText}>{manhwa.rating}</Text>
        </View>
        {manhwa.status === "Ongoing" && (
          <View style={[styles.statusBadge, { backgroundColor: colors.primary }]}>
            <Text style={styles.statusText}>LIVE</Text>
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {manhwa.title}
        </Text>
        <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
          Ch.{manhwa.chapters.length} · {manhwa.genre[0]}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface HorizontalProps {
  manhwa: Manhwa;
}

export function ManhwaRow({ manhwa }: HorizontalProps) {
  const colors = useColors();
  return (
    <TouchableOpacity
      style={[styles.row, { borderBottomColor: colors.border }]}
      onPress={() => router.push({ pathname: "/details", params: { id: manhwa.id } })}
      activeOpacity={0.8}
    >
      <View style={[styles.rowCover]}>
        <CoverPlaceholder manhwaId={manhwa.id} title={manhwa.title} />
      </View>
      <View style={styles.rowInfo}>
        <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
          {manhwa.title}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
          {manhwa.author}
        </Text>
        <View style={styles.rowTags}>
          {manhwa.genre.slice(0, 2).map((g) => (
            <View key={g} style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{g}</Text>
            </View>
          ))}
        </View>
        <Text style={[styles.rowRating, { color: colors.primary }]}>
          <MaterialCommunityIcons name="star" size={12} color="#FFD700" /> {manhwa.rating}
        </Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 10,
    overflow: "hidden",
    marginBottom: 12,
  },
  cover: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  coverPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  coverInitials: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: 2,
  },
  coverAccent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  ratingBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    backgroundColor: "rgba(0,0,0,0.75)",
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  ratingText: {
    color: "#FFD700",
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  statusBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  statusText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  info: {
    padding: 8,
    gap: 2,
  },
  title: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 16,
  },
  meta: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
  },
  rowCover: {
    width: 56,
    height: 76,
    borderRadius: 6,
    overflow: "hidden",
  },
  rowInfo: {
    flex: 1,
    gap: 3,
  },
  rowTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  rowMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  rowTags: {
    flexDirection: "row",
    gap: 4,
    flexWrap: "wrap",
  },
  tag: {
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
  },
  rowRating: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
});
