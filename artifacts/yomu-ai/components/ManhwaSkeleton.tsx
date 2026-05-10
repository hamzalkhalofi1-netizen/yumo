import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const CARD_WIDTH = (width - 48) / 2;

export function ManhwaCardSkeleton() {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[styles.card, { width: CARD_WIDTH, backgroundColor: colors.card, opacity: anim }]}
    >
      <View style={[styles.cover, { backgroundColor: colors.muted }]} />
      <View style={styles.info}>
        <View style={[styles.line, { backgroundColor: colors.muted, width: "90%" }]} />
        <View style={[styles.line, { backgroundColor: colors.muted, width: "60%" }]} />
      </View>
    </Animated.View>
  );
}

export function ManhwaRowSkeleton() {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View style={[styles.row, { borderBottomColor: colors.border, opacity: anim }]}>
      <View style={[styles.rowCover, { backgroundColor: colors.muted }]} />
      <View style={styles.rowInfo}>
        <View style={[styles.line, { backgroundColor: colors.muted, width: "80%" }]} />
        <View style={[styles.line, { backgroundColor: colors.muted, width: "50%" }]} />
        <View style={[styles.line, { backgroundColor: colors.muted, width: "35%" }]} />
      </View>
    </Animated.View>
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
    height: CARD_WIDTH * 1.45 - 60,
  },
  info: {
    padding: 8,
    gap: 6,
  },
  line: {
    height: 10,
    borderRadius: 5,
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
  },
  rowInfo: {
    flex: 1,
    gap: 8,
  },
});
