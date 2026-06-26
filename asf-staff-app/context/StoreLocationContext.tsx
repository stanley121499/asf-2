import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";

import type { Database } from "@/database.types";
import { apiFetch } from "@/lib/apiFetch";

export type StoreLocation = Database["public"]["Tables"]["store_locations"]["Row"];

export type CreateStoreLocationPayload = {
  name: string;
  mall_name: string;
  address_line_1: string;
  address_line_2?: string | null;
  city: string;
  state: string;
  postcode?: string | null;
  country?: string;
  phone?: string | null;
  opening_hours?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  google_maps_url?: string | null;
  waze_url?: string | null;
  sort_order?: number;
  active?: boolean;
};

export type UpdateStoreLocationPayload = Partial<CreateStoreLocationPayload>;

type StoreLocationContextValue = {
  storeLocations: StoreLocation[];
  loading: boolean;
  refreshStoreLocations: () => Promise<void>;
  createStoreLocation: (
    payload: CreateStoreLocationPayload
  ) => Promise<StoreLocation | undefined>;
  updateStoreLocation: (
    id: string,
    payload: UpdateStoreLocationPayload
  ) => Promise<StoreLocation | undefined>;
  deleteStoreLocation: (id: string) => Promise<void>;
};

const StoreLocationContext = createContext<StoreLocationContextValue | undefined>(
  undefined
);

/**
 * Runtime helper: narrows unknown JSON into a plain object.
 */
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/**
 * Loads and mutates store locations via Next.js API routes.
 */
export function StoreLocationProvider({
  children,
}: Readonly<PropsWithChildren>): React.ReactElement {
  const [storeLocations, setStoreLocations] = useState<StoreLocation[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshStoreLocations = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/store-locations", { method: "GET" });
      const json: unknown = await res.json();
      if (!res.ok || !isRecord(json)) {
        setStoreLocations([]);
        return;
      }
      const list = json["storeLocations"];
      if (!Array.isArray(list)) {
        setStoreLocations([]);
        return;
      }
      setStoreLocations(list as StoreLocation[]);
    } catch {
      setStoreLocations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshStoreLocations();
  }, [refreshStoreLocations]);

  const createStoreLocation = useCallback(
    async (payload: CreateStoreLocationPayload): Promise<StoreLocation | undefined> => {
      const res = await apiFetch("/api/store-locations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: unknown = await res.json();
      if (!res.ok || !isRecord(json)) {
        return undefined;
      }
      const row = json["storeLocation"];
      if (!isRecord(row)) {
        return undefined;
      }
      await refreshStoreLocations();
      return row as StoreLocation;
    },
    [refreshStoreLocations]
  );

  const updateStoreLocation = useCallback(
    async (
      id: string,
      payload: UpdateStoreLocationPayload
    ): Promise<StoreLocation | undefined> => {
      const res = await apiFetch(`/api/store-locations/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json: unknown = await res.json();
      if (!res.ok || !isRecord(json)) {
        return undefined;
      }
      const row = json["storeLocation"];
      if (!isRecord(row)) {
        return undefined;
      }
      await refreshStoreLocations();
      return row as StoreLocation;
    },
    [refreshStoreLocations]
  );

  const deleteStoreLocation = useCallback(
    async (id: string): Promise<void> => {
      const res = await apiFetch(`/api/store-locations/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await refreshStoreLocations();
      }
    },
    [refreshStoreLocations]
  );

  const value = useMemo(
    (): StoreLocationContextValue => ({
      storeLocations,
      loading,
      refreshStoreLocations,
      createStoreLocation,
      updateStoreLocation,
      deleteStoreLocation,
    }),
    [
      storeLocations,
      loading,
      refreshStoreLocations,
      createStoreLocation,
      updateStoreLocation,
      deleteStoreLocation,
    ]
  );

  return (
    <StoreLocationContext.Provider value={value}>
      {children}
    </StoreLocationContext.Provider>
  );
}

export function useStoreLocationContext(): StoreLocationContextValue {
  const ctx = useContext(StoreLocationContext);
  if (ctx === undefined) {
    throw new Error("useStoreLocationContext must be used within StoreLocationProvider");
  }
  return ctx;
}
