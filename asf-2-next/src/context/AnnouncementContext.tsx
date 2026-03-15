"use client";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import { supabase } from "@/utils/supabaseClient";
import type { Tables } from "@/database.types";

/** A single announcement row from the database */
export type AnnouncementRow = Tables<"announcements">;

/** localStorage key for tracking which announcement IDs have been dismissed */
const DISMISSED_KEY = "asf-dismissed-announcements";

/**
 * Reads the set of previously dismissed announcement IDs from localStorage.
 * Returns an empty Set if localStorage is unavailable (e.g. SSR).
 */
function getDismissedIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (typeof raw !== "string" || raw.length === 0) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((v): v is string => typeof v === "string"));
  } catch {
    return new Set();
  }
}

/**
 * Saves the set of dismissed announcement IDs to localStorage.
 */
function saveDismissedIds(ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(ids)));
  } catch {
    // Silently ignore storage errors (e.g. private browsing quota exceeded)
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
   * Stores the ID in localStorage so it won't show again on this device.
   */
  dismissAnnouncement: (id: string) => void;
}

const AnnouncementContext = createContext<AnnouncementContextProps | undefined>(undefined);

/**
 * AnnouncementProvider fetches the latest active announcement from Supabase
 * and exposes it via context. Dismissed announcements are tracked in localStorage.
 */
export function AnnouncementProvider({ children }: PropsWithChildren): JSX.Element {
  const [announcement, setAnnouncement] = useState<AnnouncementRow | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  /** Fetch the latest active announcement from Supabase */
  const fetchAnnouncement = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
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
        // Silently ignore if the table doesn't exist yet (PGRST116 = no rows, 42P01 = table missing)
        if (process.env.NODE_ENV === "development") {
          console.warn("[AnnouncementContext] fetch error:", error.message);
        }
        setAnnouncement(null);
        return;
      }

      if (data === null) {
        setAnnouncement(null);
        return;
      }

      // Check if this announcement was already dismissed on this device
      const dismissed = getDismissedIds();
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
    void fetchAnnouncement();
  }, [fetchAnnouncement]);

  /**
   * Dismisses an announcement by ID — persists to localStorage and clears state.
   */
  const dismissAnnouncement = useCallback((id: string): void => {
    const dismissed = getDismissedIds();
    dismissed.add(id);
    saveDismissedIds(dismissed);
    setAnnouncement(null);
  }, []);

  const value = useMemo<AnnouncementContextProps>(
    () => ({ announcement, loading, dismissAnnouncement }),
    [announcement, dismissAnnouncement, loading]
  );

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
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
