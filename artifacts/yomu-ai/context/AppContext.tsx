import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export type SubscriptionPlan = "free" | "premium";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  plan: SubscriptionPlan;
  dailyAIChaptersUsed: number;
  dailyAIChaptersLimit: number;
  joinDate: string;
  referralCode: string;
  referrals: number;
  adsWatchedToday: number;
}

export interface ReadingHistoryItem {
  manhwaId: string;
  manhwaTitle: string;
  cover: string;
  chapterNumber: number;
  chapterTitle: string;
  readAt: string;
}

export interface FavoriteManhwa {
  id: string;
  title: string;
  cover: string;
  genre: string;
  rating: number;
}

interface AppContextType {
  user: UserProfile;
  readingHistory: ReadingHistoryItem[];
  favorites: FavoriteManhwa[];
  isDark: boolean;
  canUseAI: boolean;
  remainingAIChapters: number;
  useAIChapter: () => boolean;
  watchAd: () => void;
  addToFavorites: (manhwa: FavoriteManhwa) => void;
  removeFromFavorites: (manhwaId: string) => void;
  isFavorite: (manhwaId: string) => boolean;
  addToHistory: (item: ReadingHistoryItem) => void;
  upgradeToPremium: () => void;
}

const defaultUser: UserProfile = {
  id: "user_001",
  name: "Yomu Reader",
  email: "reader@yomuai.app",
  avatar: "",
  plan: "free",
  dailyAIChaptersUsed: 3,
  dailyAIChaptersLimit: 10,
  joinDate: "2026-01-15",
  referralCode: "YOMU5XK",
  referrals: 2,
  adsWatchedToday: 1,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>(defaultUser);
  const [readingHistory, setReadingHistory] = useState<ReadingHistoryItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteManhwa[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [historyRaw, favoritesRaw, userRaw] = await Promise.all([
        AsyncStorage.getItem("reading_history"),
        AsyncStorage.getItem("favorites"),
        AsyncStorage.getItem("user_profile"),
      ]);
      if (historyRaw) setReadingHistory(JSON.parse(historyRaw));
      if (favoritesRaw) setFavorites(JSON.parse(favoritesRaw));
      if (userRaw) setUser(JSON.parse(userRaw));
    } catch {}
  };

  const saveUser = async (u: UserProfile) => {
    setUser(u);
    await AsyncStorage.setItem("user_profile", JSON.stringify(u));
  };

  const remainingAIChapters =
    user.dailyAIChaptersLimit - user.dailyAIChaptersUsed;
  const canUseAI = remainingAIChapters > 0;

  const useAIChapter = useCallback((): boolean => {
    if (!canUseAI) return false;
    saveUser({ ...user, dailyAIChaptersUsed: user.dailyAIChaptersUsed + 1 });
    return true;
  }, [user, canUseAI]);

  const watchAd = useCallback(() => {
    if (user.adsWatchedToday < 5) {
      saveUser({
        ...user,
        dailyAIChaptersLimit: user.dailyAIChaptersLimit + 2,
        adsWatchedToday: user.adsWatchedToday + 1,
      });
    }
  }, [user]);

  const addToFavorites = useCallback(
    async (manhwa: FavoriteManhwa) => {
      const updated = [manhwa, ...favorites.filter((f) => f.id !== manhwa.id)];
      setFavorites(updated);
      await AsyncStorage.setItem("favorites", JSON.stringify(updated));
    },
    [favorites]
  );

  const removeFromFavorites = useCallback(
    async (manhwaId: string) => {
      const updated = favorites.filter((f) => f.id !== manhwaId);
      setFavorites(updated);
      await AsyncStorage.setItem("favorites", JSON.stringify(updated));
    },
    [favorites]
  );

  const isFavorite = useCallback(
    (manhwaId: string) => favorites.some((f) => f.id === manhwaId),
    [favorites]
  );

  const addToHistory = useCallback(
    async (item: ReadingHistoryItem) => {
      const updated = [
        item,
        ...readingHistory.filter((h) => h.manhwaId !== item.manhwaId),
      ].slice(0, 50);
      setReadingHistory(updated);
      await AsyncStorage.setItem("reading_history", JSON.stringify(updated));
    },
    [readingHistory]
  );

  const upgradeToPremium = useCallback(() => {
    saveUser({
      ...user,
      plan: "premium",
      dailyAIChaptersLimit: 50,
    });
  }, [user]);

  return (
    <AppContext.Provider
      value={{
        user,
        readingHistory,
        favorites,
        isDark: true,
        canUseAI,
        remainingAIChapters,
        useAIChapter,
        watchAd,
        addToFavorites,
        removeFromFavorites,
        isFavorite,
        addToHistory,
        upgradeToPremium,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
