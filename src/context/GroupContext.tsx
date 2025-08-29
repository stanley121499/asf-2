import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    setLoading(true);
    const fetchAll = async () => {
      const { data, error } = await supabase.from("groups").select("*");
      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }
      setGroups((data ?? []) as GroupRow[]);
      setLoading(false);
    };

    fetchAll();

    const onGroup = (payload: RealtimePostgresChangesPayload<GroupRow>) => {
      if (payload.eventType === "INSERT") {
        setGroups((prev) => [...prev, payload.new as GroupRow]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as GroupRow;
        setGroups((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as GroupRow;
        setGroups((prev) => prev.filter((g) => g.id !== removed.id));
      }
    };

    const sub = supabase
      .channel("groups")
      .on("postgres_changes", { event: "*", schema: "public", table: "groups" }, (p: RealtimePostgresChangesPayload<GroupRow>) => onGroup(p))
      .subscribe();

    return () => {
      sub.unsubscribe();
    };
  }, [showAlert]);

  const api = useMemo<GroupAPI>(() => {
    return {
      groups,
      loading,
      async createGroup(payload: GroupInsert) {
        const { data, error } = await supabase.from("groups").insert(payload).select("*").single();
        if (error) {
          showAlert(error.message, "error");
          return undefined;
        }
        return data as GroupRow;
      },
      async updateGroup(id: string, payload: GroupUpdate) {
        const { data, error } = await supabase.from("groups").update(payload).eq("id", id).select("*").single();
        if (error) {
          showAlert(error.message, "error");
          return undefined;
        }
        return data as GroupRow;
      },
      async deleteGroup(id: string) {
        const { error } = await supabase.from("groups").delete().eq("id", id);
        if (error) {
          showAlert(error.message, "error");
        }
      },
    };
  }, [groups, loading, showAlert]);

  return <GroupContext.Provider value={api}>{children}</GroupContext.Provider>;
};

export function useGroupContext(): GroupAPI {
  const ctx = useContext(GroupContext);
  if (ctx === null) {
    throw new Error("useGroupContext must be used within a GroupProvider");
  }
  return ctx;
}


