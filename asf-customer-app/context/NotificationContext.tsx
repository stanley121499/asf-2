import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "@/database.types";
import { useP2FocusRetain } from "@/lib/useP2FocusRetain";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "./AuthContext";

/** Database row shape for `public.notifications`. */
export type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

/** Values exposed to consumers via `useNotificationContext`. */
export interface NotificationContextValue {
  notifications: NotificationRow[];
  unreadCount: number;
  loading: boolean;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  /** P2: retain fetch + INSERT realtime while a notifications surface is focused. */
  retainFocus: () => () => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(undefined);

/**
 * Narrows a realtime payload record to `NotificationRow` for safe state updates.
 */
function isNotificationRow(value: unknown): value is NotificationRow {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const r = value as Record<string, unknown>;
  return (
    typeof r.id === "string" &&
    typeof r.user_id === "string" &&
    typeof r.type === "string" &&
    typeof r.title === "string" &&
    typeof r.body === "string" &&
    typeof r.created_at === "string" &&
    (r.read_at === null || typeof r.read_at === "string")
  );
}

/**
 * Provides the current user's notification list, unread count, realtime INSERT
 * updates, and optimistic mark-as-read operations with rollback on failure.
 *
 * Initial fetch + realtime run only while a screen holds {@link retainFocus} (P2).
 */
export function NotificationProvider({ children }: PropsWithChildren): React.ReactElement {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [retainCount, setRetainCount] = useState(0);

  const userId = user?.id;

  const retainFocus = useCallback((): (() => void) => {
    setRetainCount((count) => count + 1);
    let released = false;
    return () => {
      if (released) {
        return;
      }
      released = true;
      setRetainCount((count) => Math.max(0, count - 1));
    };
  }, []);

  /**
   * Loads the latest notifications and subscribes to INSERTs while retained.
   */
  useEffect(() => {
    if (retainCount === 0) {
      return;
    }

    if (typeof userId !== "string" || userId.length === 0) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    const uid = userId;
    let cancelled = false;

    async function fetchNotifications(): Promise<void> {
      setLoading(true);
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(50);

      if (cancelled) {
        return;
      }

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("Failed to fetch notifications:", error);
        }
        setNotifications([]);
      } else {
        setNotifications(data ?? []);
      }
      setLoading(false);
    }

    void fetchNotifications();

    const handleInsert = (payload: RealtimePostgresChangesPayload<NotificationRow>): void => {
      const row = payload.new;
      if (row === null || row === undefined || !isNotificationRow(row)) {
        return;
      }
      setNotifications((prev) => {
        if (prev.some((n) => n.id === row.id)) {
          return prev;
        }
        return [row, ...prev];
      });
    };

    const channel = supabase
      .channel(`notifications:${uid}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${uid}`,
        },
        handleInsert
      )
      .subscribe();

    return () => {
      cancelled = true;
      void supabase.removeChannel(channel);
    };
  }, [retainCount, userId]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => n.read_at === null).length,
    [notifications]
  );

  /**
   * Marks a single notification as read (optimistic update, reverts if the update fails).
   */
  const markAsRead = useCallback(
    async (id: string): Promise<void> => {
      if (typeof userId !== "string" || userId.length === 0) {
        return;
      }

      const readAt = new Date().toISOString();
      let snapshotForRevert: NotificationRow[] = [];

      setNotifications((prev) => {
        snapshotForRevert = prev.map((row) => ({ ...row }));
        return prev.map((n) => (n.id === id ? { ...n, read_at: readAt } : n));
      });

      const { error } = await supabase
        .from("notifications")
        .update({ read_at: readAt })
        .eq("id", id)
        .eq("user_id", userId);

      if (error) {
        if (process.env.NODE_ENV === "development") {
          console.error("markAsRead failed:", error);
        }
        setNotifications(snapshotForRevert);
      }
    },
    [userId]
  );

  /**
   * Marks every unread notification as read (optimistic update, reverts if the update fails).
   */
  const markAllAsRead = useCallback(async (): Promise<void> => {
    if (typeof userId !== "string" || userId.length === 0) {
      return;
    }

    const readAt = new Date().toISOString();
    let snapshotForRevert: NotificationRow[] = [];

    setNotifications((prev) => {
      snapshotForRevert = prev.map((row) => ({ ...row }));
      return prev.map((n) => (n.read_at === null ? { ...n, read_at: readAt } : n));
    });

    const { error } = await supabase
      .from("notifications")
      .update({ read_at: readAt })
      .eq("user_id", userId)
      .is("read_at", null);

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("markAllAsRead failed:", error);
      }
      setNotifications(snapshotForRevert);
    }
  }, [userId]);

  const value = useMemo<NotificationContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      markAsRead,
      markAllAsRead,
      retainFocus,
    }),
    [notifications, unreadCount, loading, markAsRead, markAllAsRead, retainFocus]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
}

/**
 * Returns the notification context; throws if used outside `NotificationProvider`.
 */
export function useNotificationContext(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error("useNotificationContext must be used within a NotificationProvider");
  }
  return context;
}

/** P2: notifications fetch/realtime while this screen is focused. */
export function useNotificationP2Focus(name: string = "notifications"): void {
  const { retainFocus } = useNotificationContext();
  useP2FocusRetain(name, retainFocus);
}
