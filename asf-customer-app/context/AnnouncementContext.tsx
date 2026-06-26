import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { Tables } from "@/database.types";
import { supabase } from "@/lib/supabase";

/** A single announcement row from the database */
export type AnnouncementRow = Tables<"announcements">;

/** AsyncStorage key for tracking which announcement IDs have been dismissed */
const DISMISSED_KEY = "asf-dismissed-announcements";

/**
 * Loads dismissed announcement IDs from AsyncStorage.
 */
async function loadDismissedIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(DISMISSED_KEY);
    if (typeof raw !== "string" || raw.length === 0) {
      return new Set();
    }
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return new Set();
    }
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

/**
 * Persists dismissed announcement IDs to AsyncStorage.
 */
async function persistDismissedIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Ignore storage errors (quota, etc.)
  }
}

/** Public API for the Announcement context */
export interface AnnouncementContextProps {
  /** The current active announcement, or null if none / dismissed */
  announcement: AnnouncementRow | null;
  /** Whether the fetch is in progress */
  loading: boolean;
  /**
   * Dismisses the announcement with the given ID for this session.
   * Stores the ID in AsyncStorage so it will not show again on this device.
   */
  dismissAnnouncement: (id: string) => void;
}

const AnnouncementContext = createContext<AnnouncementContextProps | undefined>(undefined);

/**
 * AnnouncementProvider fetches the latest active announcement from Supabase
 * and exposes it via context. Dismissed announcements are tracked in AsyncStorage.
 */
export function AnnouncementProvider({ children }: PropsWithChildren): React.ReactElement {
  const [announcement, setAnnouncement] = useState<AnnouncementRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshAnnouncement = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const dismissed = await loadDismissedIds();

      const now = new Date().toISOString();

      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .eq("active", true)
        .or(`starts_at.is.null,starts_at.lte.${now}`)
        .or(`ends_at.is.null,ends_at.gte.${now}`)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        if (__DEV__) {
          console.warn("[AnnouncementContext] fetch error:", error.message);
        }
        setAnnouncement(null);
        return;
      }

      if (data === null) {
        setAnnouncement(null);
        return;
      }

      if (dismissed.has(data.id)) {
        setAnnouncement(null);
        return;
      }

      setAnnouncement(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async (): Promise<void> => {
      await refreshAnnouncement();
      if (cancelled) {
        return;
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshAnnouncement]);

  /**
   * Dismisses an announcement by ID — persists to AsyncStorage and clears state.
   */
  const dismissAnnouncement = useCallback(
    (id: string): void => {
      void (async (): Promise<void> => {
        const dismissed = await loadDismissedIds();
        dismissed.add(id);
        await persistDismissedIds(dismissed);
        setAnnouncement(null);
      })();
    },
    []
  );

  const value = useMemo<AnnouncementContextProps>(
    () => ({ announcement, loading, dismissAnnouncement }),
    [announcement, dismissAnnouncement, loading]
  );

  return (
    <AnnouncementContext.Provider value={value}>{children}</AnnouncementContext.Provider>
  );
}

/**
 * Hook to access the Announcement context.
 * Must be used within an AnnouncementProvider.
 */
export function useAnnouncementContext(): AnnouncementContextProps {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error("useAnnouncementContext must be used within an AnnouncementProvider");
  }
  return context;
}
