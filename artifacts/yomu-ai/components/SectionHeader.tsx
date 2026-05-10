import { router } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  title: string;
  seeAllRoute?: string;
}

export function SectionHeader({ title, seeAllRoute }: Props) {
  const colors = useColors();
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <View style={[styles.accent, { backgroundColor: colors.primary }]} />
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
      </View>
      {seeAllRoute && (
        <TouchableOpacity onPress={() => router.push(seeAllRoute as any)}>
          <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accent: {
    width: 3,
    height: 18,
    borderRadius: 2,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.2,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
