import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Tables, TablesInsert, TablesUpdate } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/**
 * GroupContext provides CRUD and realtime sync for groups that may or may not belong to a community.
 */
type GroupRow = Tables<"groups">;
type GroupInsert = TablesInsert<"groups">;
type GroupUpdate = TablesUpdate<"groups">;

type GroupAPI = {
  groups: GroupRow[];
  loading: boolean;
  createGroup: (payload: GroupInsert) => Promise<GroupRow | undefined>;
  updateGroup: (id: string, payload: GroupUpdate) => Promise<GroupRow | undefined>;
  deleteGroup: (id: string) => Promise<void>;
};

const GroupContext = createContext<GroupAPI | null>(null);

export const GroupProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [groups, setGroups] = useState<GroupRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  /**
   * Fetch all groups.
   */
  const fetchAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("groups").select("*");
      if (error) {
        showAlert(error.message, "error");
        return;
      }
      setGroups(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Realtime handler for group changes.
   */
  const onGroup = useCallback((payload: RealtimePostgresChangesPayload<GroupRow>): void => {
    if (payload.eventType === "INSERT") {
      setGroups((prev) => [...prev, payload.new]);
    }
    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
    }
    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      setGroups((prev) => prev.filter((g) => g.id !== removed.id));
    }
  }, []);

  useEffect(() => {
    void fetchAll();

    const sub = supabase
      .channel("groups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        (p: RealtimePostgresChangesPayload<GroupRow>) => onGroup(p)
      )
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [fetchAll, onGroup]);

  /**
   * Create a new group.
   */
  const createGroup = useCallback(async (payload: GroupInsert): Promise<GroupRow | undefined> => {
    const { data, error } = await supabase.from("groups").insert(payload).select("*").single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return data;
  }, [showAlert]);

  /**
   * Update an existing group.
   */
  const updateGroup = useCallback(async (id: string, payload: GroupUpdate): Promise<GroupRow | undefined> => {
    const { data, error } = await supabase.from("groups").update(payload).eq("id", id).select("*").single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return data;
  }, [showAlert]);

  /**
   * Delete a group by id.
   */
  const deleteGroup = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) {
      showAlert(error.message, "error");
    }
  }, [showAlert]);

  const api = useMemo<GroupAPI>(() => {
    return {
      groups,
      loading,
      createGroup,
      updateGroup,
      deleteGroup,
    };
  }, [groups, loading, createGroup, updateGroup, deleteGroup]);

  return <GroupContext.Provider value={api}>{children}</GroupContext.Provider>;
};

export function useGroupContext(): GroupAPI {
  const ctx = useContext(GroupContext);
  if (ctx === null) {
    throw new Error("useGroupContext must be used within a GroupProvider");
  }
  return ctx;
}


