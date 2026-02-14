import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

export type HomePageElement =
  Database["public"]["Tables"]["homepage_elements"]["Row"];
export type HomePageElements = { elements: HomePageElement[] };
export type HomePageElementInsert =
  Database["public"]["Tables"]["homepage_elements"]["Insert"];
export type HomePageElementUpdate =
  Database["public"]["Tables"]["homepage_elements"]["Update"];

interface HomePageElementContextProps {
  elements: HomePageElement[];
  createElement: (element: HomePageElementInsert) => Promise<void>;
  updateElement: (element: HomePageElementUpdate) => Promise<void>;
  deleteElement: (elementId: string) => Promise<void>;
  loading: boolean;
}

const HomePageElementContext = createContext<HomePageElementContextProps | undefined>(undefined);

export function HomePageElementProvider({ children }: PropsWithChildren<{}>) {
  const [elements, setElements] = useState<HomePageElement[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  /**
   * Fetch all homepage elements ordered by arrangement.
   */
  const fetchElements = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("homepage_elements")
        .select("*")
        .order("arrangement", { ascending: true });

      if (error) {
        showAlert(error.message, "error");
        return;
      }

      setElements(data ?? []);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Realtime handler for homepage elements changes.
   */
  const handleChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<HomePageElement>) => {
      if (payload.eventType === "INSERT") {
        setElements((prev) => [...prev, payload.new]);
      }

      if (payload.eventType === "UPDATE") {
        setElements((prev) =>
          prev.map((element) =>
            element.id === payload.new.id ? payload.new : element
          )
        );
      }

      if (payload.eventType === "DELETE") {
        setElements((prev) =>
          prev.filter((element) => element.id !== payload.old.id)
        );
      }
    },
    []
  );

  // Initial fetch + subscription setup.
  useEffect(() => {
    void fetchElements();

    const subscription = supabase
      .channel("homepage_elements")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "homepage_elements" },
        (payload: RealtimePostgresChangesPayload<HomePageElement>) => {
          handleChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchElements, handleChanges]);

  /**
   * Create a new homepage element.
   */
  const createElement = useCallback(async (element: HomePageElementInsert): Promise<void> => {
    const { error } = await supabase.from("homepage_elements").insert(element);

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Element created successfully", "success");
  }, [showAlert]);

  /**
   * Update an existing homepage element.
   */
  const updateElement = useCallback(async (element: HomePageElementUpdate): Promise<void> => {
    const { error } = await supabase
      .from("homepage_elements")
      .update(element)
      .match({ id: element.id });

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Element updated successfully", "success");
  }, [showAlert]);

  /**
   * Delete a homepage element by id.
   */
  const deleteElement = useCallback(async (elementId: string): Promise<void> => {
    const { error } = await supabase
      .from("homepage_elements")
      .delete()
      .match({ id: elementId });

    if (error) {
      showAlert(error.message, "error");
      return;
    }

    showAlert("Element deleted successfully", "success");
  }, [showAlert]);

  // Memoize provider value to prevent unnecessary re-renders.
  const value = useMemo<HomePageElementContextProps>(
    () => ({
      elements,
      createElement,
      updateElement,
      deleteElement,
      loading,
    }),
    [elements, createElement, updateElement, deleteElement, loading]
  );

  return (
    <HomePageElementContext.Provider value={value}>{children}</HomePageElementContext.Provider>
  );
}

export function useHomePageElementContext() {
  const context = useContext(HomePageElementContext);
  if (!context) {
    throw new Error(
      "useHomePageElementContext must be used within a HomePageElementProvider"
    );
  }
  return context;
}
