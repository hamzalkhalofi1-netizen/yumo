import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EqualiserLoader } from "@/components/EqualiserLoader";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { user, remainingAIChapters, watchAd, upgradeToPremium, favorites, readingHistory } = useApp();
  const topPadding = isWeb ? 67 : insets.top;

  const aiUsed = user.dailyAIChaptersUsed;
  const aiTotal = user.dailyAIChaptersLimit;
  const aiPct = aiTotal > 0 ? Math.min((aiUsed / aiTotal) * 100, 100) : 0;

  const handleWatchAd = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (user.adsWatchedToday >= 5) {
      Alert.alert("Limit reached", "You've watched the maximum ads for today.");
      return;
    }
    watchAd();
    Alert.alert("Reward Unlocked!", "+2 AI chapters added to your daily limit.");
  };

  const handleUpgrade = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Alert.alert(
      "Upgrade to Premium",
      "Get 50 AI chapters per day, no ads, and priority access to new manhwa. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Upgrade",
          onPress: () => {
            upgradeToPremium();
            Alert.alert("Welcome to Premium!", "You now have 50 AI chapters per day.");
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[
        styles.content,
        { paddingTop: topPadding + 12, paddingBottom: isWeb ? 34 : 100 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.profileCard}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>
            {user.name.split(" ").map((w) => w[0]).join("").toUpperCase()}
          </Text>
        </View>
        <View style={styles.profileInfo}>
          <Text style={[styles.name, { color: colors.foreground }]}>{user.name}</Text>
          <Text style={[styles.email, { color: colors.mutedForeground }]}>{user.email}</Text>
          {user.plan === "premium" ? (
            <View style={[styles.planBadge, { backgroundColor: "#FFD700" }]}>
              <MaterialCommunityIcons name="crown" size={12} color="#000" />
              <Text style={styles.planBadgeText}>PREMIUM</Text>
            </View>
          ) : (
            <View style={[styles.planBadge, { backgroundColor: colors.muted }]}>
              <MaterialCommunityIcons name="account" size={12} color={colors.mutedForeground} />
              <Text style={[styles.planBadgeText, { color: colors.mutedForeground }]}>FREE</Text>
            </View>
          )}
        </View>
        <EqualiserLoader color={colors.primary} barCount={5} height={28} />
      </View>

      <View style={styles.statsRow}>
        {[
          { label: "Favorites", value: favorites.length, icon: "heart" as const },
          { label: "Read", value: readingHistory.length, icon: "book-open" as const },
          { label: "Referrals", value: user.referrals, icon: "account-multiple" as const },
        ].map((s) => (
          <View key={s.label} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <MaterialCommunityIcons name={s.icon} size={20} color={colors.primary} />
            <Text style={[styles.statValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <View style={styles.cardHeader}>
          <MaterialCommunityIcons name="translate" size={18} color={colors.primary} />
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>AI Translation</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {aiUsed}/{aiTotal} used today
          </Text>
        </View>
        <View style={[styles.progressBar, { backgroundColor: colors.muted }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: aiPct >= 90 ? "#FF5252" : colors.primary,
                width: `${aiPct}%`,
              },
            ]}
          />
        </View>
        <Text style={[styles.remaining, { color: colors.mutedForeground }]}>
          {remainingAIChapters} chapters remaining
        </Text>
      </View>

      {user.plan === "free" && (
        <>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.muted }]}
            onPress={handleWatchAd}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="play-circle-outline" size={22} color={colors.primary} />
            <View style={styles.actionInfo}>
              <Text style={[styles.actionTitle, { color: colors.foreground }]}>Watch Ad</Text>
              <Text style={[styles.actionSub, { color: colors.mutedForeground }]}>
                +2 AI chapters · {5 - user.adsWatchedToday} remaining today
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={colors.mutedForeground} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
            onPress={handleUpgrade}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="crown" size={20} color="#FFD700" />
            <View style={styles.upgradeInfo}>
              <Text style={styles.upgradeTitle}>Upgrade to Premium</Text>
              <Text style={styles.upgradeSub}>50 AI chapters · No Ads · Priority Access</Text>
            </View>
            <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
          </TouchableOpacity>
        </>
      )}

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>REFERRAL</Text>
        <View style={styles.referralRow}>
          <View style={[styles.referralCode, { backgroundColor: colors.muted }]}>
            <Text style={[styles.referralCodeText, { color: colors.foreground }]}>
              {user.referralCode}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.copyBtn, { backgroundColor: colors.primary }]}
            onPress={() => Alert.alert("Copied!", `Code ${user.referralCode} copied.`)}
          >
            <MaterialCommunityIcons name="content-copy" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.referralNote, { color: colors.mutedForeground }]}>
          Share your code · Each referral gives you +5 AI chapters
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SETTINGS</Text>
        {[
          { icon: "bell-outline" as const, label: "Notifications" },
          { icon: "translate" as const, label: "Language Preferences" },
          { icon: "shield-outline" as const, label: "Privacy" },
          { icon: "help-circle-outline" as const, label: "Help & Support" },
          { icon: "information-outline" as const, label: "About Yomu AI" },
        ].map((item, idx, arr) => (
          <TouchableOpacity
            key={item.label}
            style={[
              styles.settingRow,
              { borderBottomColor: colors.border, borderBottomWidth: idx < arr.length - 1 ? 0.5 : 0 },
            ]}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons name={item.icon} size={20} color={colors.mutedForeground} />
            <Text style={[styles.settingLabel, { color: colors.foreground }]}>{item.label}</Text>
            <MaterialCommunityIcons name="chevron-right" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 16 },
  profileCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  name: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  email: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  planBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#000",
    letterSpacing: 0.8,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    paddingVertical: 14,
    borderRadius: 12,
  },
  statValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  card: {
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  cardSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  remaining: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
  },
  actionInfo: { flex: 1 },
  actionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  actionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 18,
    borderRadius: 14,
  },
  upgradeInfo: { flex: 1 },
  upgradeTitle: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  upgradeSub: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
    marginBottom: 4,
  },
  referralRow: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  referralCode: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  referralCodeText: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  copyBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  referralNote: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 13,
  },
  settingLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
