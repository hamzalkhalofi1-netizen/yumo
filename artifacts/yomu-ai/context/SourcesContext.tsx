import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export interface ManhwaSource {
  id: string;
  name: string;
  url: string;
  addedAt: string;
  manhwaCount: number;
  lastTestedOk: boolean;
}

interface SourcesContextType {
  sources: ManhwaSource[];
  activeSource: ManhwaSource | null;
  setActiveSource: (source: ManhwaSource | null) => void;
  addSource: (name: string, url: string, count?: number) => Promise<ManhwaSource>;
  removeSource: (id: string) => Promise<void>;
  updateSourceCount: (id: string, count: number, ok: boolean) => Promise<void>;
}

const SourcesContext = createContext<SourcesContextType | undefined>(undefined);

const STORAGE_KEY = "manhwa_sources";

export function SourcesProvider({ children }: { children: React.ReactNode }) {
  const [sources, setSources] = useState<ManhwaSource[]>([]);
  const [activeSource, setActiveSourceState] = useState<ManhwaSource | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
      if (raw) setSources(JSON.parse(raw));
    });
  }, []);

  const persist = async (updated: ManhwaSource[]) => {
    setSources(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const addSource = useCallback(async (name: string, url: string, count = 0): Promise<ManhwaSource> => {
    const source: ManhwaSource = {
      id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
      name: name.trim(),
      url: url.trim(),
      addedAt: new Date().toISOString(),
      manhwaCount: count,
      lastTestedOk: count > 0,
    };
    const updated = [source, ...sources];
    await persist(updated);
    return source;
  }, [sources]);

  const removeSource = useCallback(async (id: string) => {
    const updated = sources.filter((s) => s.id !== id);
    await persist(updated);
    if (activeSource?.id === id) setActiveSourceState(null);
  }, [sources, activeSource]);

  const updateSourceCount = useCallback(async (id: string, count: number, ok: boolean) => {
    const updated = sources.map((s) =>
      s.id === id ? { ...s, manhwaCount: count, lastTestedOk: ok } : s
    );
    await persist(updated);
  }, [sources]);

  const setActiveSource = useCallback((source: ManhwaSource | null) => {
    setActiveSourceState(source);
  }, []);

  return (
    <SourcesContext.Provider value={{ sources, activeSource, setActiveSource, addSource, removeSource, updateSourceCount }}>
      {children}
    </SourcesContext.Provider>
  );
}

export function useSources() {
  const ctx = useContext(SourcesContext);
  if (!ctx) throw new Error("useSources must be used within SourcesProvider");
  return ctx;
}
