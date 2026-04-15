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
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import type { Database } from "@/database.types";
import { supabase } from "@/utils/supabaseClient";
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
 */
export function NotificationProvider({ children }: PropsWithChildren): JSX.Element {
  const { user } = useAuthContext();
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = user?.id;

  /**
   * Loads the latest notifications when the authenticated user id changes.
   */
  useEffect(() => {
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

    return () => {
      cancelled = true;
    };
  }, [userId]);

  /**
   * Subscribes to new notification rows for the current user only.
   */
  useEffect(() => {
    if (typeof userId !== "string" || userId.length === 0) {
      return;
    }

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
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        handleInsert
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

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
    }),
    [notifications, unreadCount, loading, markAsRead, markAllAsRead]
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
