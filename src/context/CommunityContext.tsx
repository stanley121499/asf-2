import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../utils/supabaseClient";
import { Tables, TablesInsert, TablesUpdate } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/**
 * CommunityContext provides CRUD and realtime sync for communities and groups.
 */
type CommunityRow = Tables<"communities">;
type CommunityInsert = TablesInsert<"communities">;
type CommunityUpdate = TablesUpdate<"communities">;

type GroupRow = Tables<"groups">;
type GroupInsert = TablesInsert<"groups">;
type GroupUpdate = TablesUpdate<"groups">;

export type Community = CommunityRow & {
  groups: GroupRow[];
};

type CommunityAPI = {
  communities: Community[];
  loading: boolean;

  // Communities
  createCommunity: (payload: CommunityInsert) => Promise<Community | undefined>;
  updateCommunity: (id: string, payload: CommunityUpdate) => Promise<Community | undefined>;
  deleteCommunity: (id: string) => Promise<void>;

  // Groups
  createGroup: (payload: GroupInsert) => Promise<GroupRow | undefined>;
  updateGroup: (id: string, payload: GroupUpdate) => Promise<GroupRow | undefined>;
  deleteGroup: (id: string) => Promise<void>;
};

const CommunityContext = createContext<CommunityAPI | null>(null);

export const CommunityProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchAll = async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*, groups(*)");
      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }
      const mapped: Community[] = (data ?? []).map((c) => ({
        ...(c as CommunityRow),
        groups: ((c as unknown as Community & { groups: GroupRow[] }).groups ?? []) as GroupRow[],
      }));
      setCommunities(mapped);
      setLoading(false);
    };

    fetchAll();

    const onCommunity = (payload: RealtimePostgresChangesPayload<CommunityRow>) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new as CommunityRow;
        setCommunities((prev) => [...prev, { ...inserted, groups: [] }]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as CommunityRow;
        setCommunities((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as CommunityRow;
        setCommunities((prev) => prev.filter((c) => c.id !== removed.id));
      }
    };

    const onGroup = (payload: RealtimePostgresChangesPayload<GroupRow>) => {
      if (payload.eventType === "INSERT") {
        const inserted = payload.new as GroupRow;
        setCommunities((prev) => prev.map((c) => (c.id === inserted.community_id ? { ...c, groups: [...c.groups, inserted] } : c)));
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as GroupRow;
        setCommunities((prev) => prev.map((c) => (c.id === updated.community_id ? { ...c, groups: c.groups.map((g) => (g.id === updated.id ? updated : g)) } : c)));
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as GroupRow;
        setCommunities((prev) => prev.map((c) => (c.id === removed.community_id ? { ...c, groups: c.groups.filter((g) => g.id !== removed.id) } : c)));
      }
    };

    const subCommunity = supabase
      .channel("communities")
      .on("postgres_changes", { event: "*", schema: "public", table: "communities" }, (p: RealtimePostgresChangesPayload<CommunityRow>) => onCommunity(p))
      .subscribe();
    const subGroup = supabase
      .channel("groups")
      .on("postgres_changes", { event: "*", schema: "public", table: "groups" }, (p: RealtimePostgresChangesPayload<GroupRow>) => onGroup(p))
      .subscribe();

    return () => {
      subCommunity.unsubscribe();
      subGroup.unsubscribe();
    };
  }, [showAlert]);

  const api = useMemo<CommunityAPI>(() => {
    return {
      communities,
      loading,

      async createCommunity(payload: CommunityInsert) {
        const { data, error } = await supabase.from("communities").insert(payload).select("*").single();
        if (error) {
          showAlert(error.message, "error");
          return undefined;
        }
        const row = data as CommunityRow;
        return { ...row, groups: [] };
      },
      async updateCommunity(id: string, payload: CommunityUpdate) {
        const { data, error } = await supabase.from("communities").update(payload).eq("id", id).select("*").single();
        if (error) {
          showAlert(error.message, "error");
          return undefined;
        }
        const row = data as CommunityRow;
        return { ...row, groups: [] };
      },
      async deleteCommunity(id: string) {
        const { error } = await supabase.from("communities").delete().eq("id", id);
        if (error) {
          showAlert(error.message, "error");
        }
      },

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
  }, [communities, loading, showAlert]);

  return (
    <CommunityContext.Provider value={api}>{children}</CommunityContext.Provider>
  );
};

export function useCommunityContext(): CommunityAPI {
  const ctx = useContext(CommunityContext);
  if (ctx === null) {
    throw new Error("useCommunityContext must be used within a CommunityProvider");
  }
  return ctx;
}


