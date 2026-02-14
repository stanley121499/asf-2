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

/**
 * Runtime helper: type guard for plain objects.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Runtime helper: extracts the `groups` array from a joined community row if present.
 */
function getJoinedGroups(value: unknown): GroupRow[] {
  if (!isRecord(value)) return [];
  const groupsValue = value["groups"];
  return Array.isArray(groupsValue) ? (groupsValue as GroupRow[]) : [];
}

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

  /**
   * Fetch all communities and include joined groups.
   */
  const fetchAll = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("communities").select("*, groups(*)");
      if (error) {
        showAlert(error.message, "error");
        return;
      }

      const rows: unknown[] = Array.isArray(data) ? (data as unknown[]) : [];
      const mapped: Community[] = rows
        .map((c): Community | null => {
          if (!isRecord(c) || typeof c["id"] !== "string") {
            return null;
          }

          const communityRow = c as CommunityRow;
          return {
            ...communityRow,
            groups: getJoinedGroups(c),
          };
        })
        .filter((c): c is Community => c !== null);

      setCommunities(mapped);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Realtime handler: communities table.
   */
  const onCommunity = useCallback((payload: RealtimePostgresChangesPayload<CommunityRow>) => {
    if (payload.eventType === "INSERT") {
      setCommunities((prev) => [...prev, { ...payload.new, groups: [] }]);
    }
    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      setCommunities((prev) => prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)));
    }
    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      setCommunities((prev) => prev.filter((c) => c.id !== removed.id));
    }
  }, []);

  /**
   * Realtime handler: groups table changes should reflect inside the joined `communities[].groups` arrays.
   */
  const onGroup = useCallback((payload: RealtimePostgresChangesPayload<GroupRow>) => {
    if (payload.eventType === "INSERT") {
      const inserted = payload.new;
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === inserted.community_id ? { ...c, groups: [...c.groups, inserted] } : c
        )
      );
    }
    if (payload.eventType === "UPDATE") {
      const updated = payload.new;
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === updated.community_id
            ? { ...c, groups: c.groups.map((g) => (g.id === updated.id ? updated : g)) }
            : c
        )
      );
    }
    if (payload.eventType === "DELETE") {
      const removed = payload.old;
      setCommunities((prev) =>
        prev.map((c) =>
          c.id === removed.community_id
            ? { ...c, groups: c.groups.filter((g) => g.id !== removed.id) }
            : c
        )
      );
    }
  }, []);

  useEffect(() => {
    void fetchAll();

    const subCommunity = supabase
      .channel("communities")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "communities" },
        (p: RealtimePostgresChangesPayload<CommunityRow>) => onCommunity(p)
      )
      .subscribe();

    const subGroup = supabase
      .channel("groups")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "groups" },
        (p: RealtimePostgresChangesPayload<GroupRow>) => onGroup(p)
      )
      .subscribe();

    return () => {
      subCommunity.unsubscribe();
      subGroup.unsubscribe();
    };
  }, [fetchAll, onCommunity, onGroup]);

  // Communities
  const createCommunity = useCallback(async (payload: CommunityInsert): Promise<Community | undefined> => {
    const { data, error } = await supabase.from("communities").insert(payload).select("*").single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return { ...data, groups: [] };
  }, [showAlert]);

  const updateCommunity = useCallback(async (id: string, payload: CommunityUpdate): Promise<Community | undefined> => {
    const { data, error } = await supabase.from("communities").update(payload).eq("id", id).select("*").single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return { ...data, groups: [] };
  }, [showAlert]);

  const deleteCommunity = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("communities").delete().eq("id", id);
    if (error) {
      showAlert(error.message, "error");
    }
  }, [showAlert]);

  // Groups
  const createGroup = useCallback(async (payload: GroupInsert): Promise<GroupRow | undefined> => {
    const { data, error } = await supabase.from("groups").insert(payload).select("*").single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return data;
  }, [showAlert]);

  const updateGroup = useCallback(async (id: string, payload: GroupUpdate): Promise<GroupRow | undefined> => {
    const { data, error } = await supabase.from("groups").update(payload).eq("id", id).select("*").single();
    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }
    return data;
  }, [showAlert]);

  const deleteGroup = useCallback(async (id: string): Promise<void> => {
    const { error } = await supabase.from("groups").delete().eq("id", id);
    if (error) {
      showAlert(error.message, "error");
    }
  }, [showAlert]);

  const api = useMemo<CommunityAPI>(() => {
    return {
      communities,
      loading,
      createCommunity,
      updateCommunity,
      deleteCommunity,
      createGroup,
      updateGroup,
      deleteGroup,
    };
  }, [
    communities,
    loading,
    createCommunity,
    updateCommunity,
    deleteCommunity,
    createGroup,
    updateGroup,
    deleteGroup,
  ]);

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


