import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  PropsWithChildren,
} from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "../AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";
import { restoreById, softDeleteById } from "../../utils/softDelete";
import { isSoftDeletedRow } from "../../utils/softDeleteRuntime";

/** Department row CRUD context with realtime sync. */
type DepartmentRow = Database["public"]["Tables"]["departments"]["Row"];
export type Department = DepartmentRow & { media_url?: string | null };
export type DepartmentInsert = Database["public"]["Tables"]["departments"]["Insert"];
export type DepartmentUpdate = Database["public"]["Tables"]["departments"]["Update"];

interface DepartmentContextProps {
  departments: Department[];
  loading: boolean;
  createDepartment: (department: DepartmentInsert & { media_url?: string | null }) => Promise<Department | undefined>;
  updateDepartment: (department: DepartmentUpdate & { id: string }) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;
  restoreDepartment: (departmentId: string) => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextProps | undefined>(undefined);

export function DepartmentProvider({ children }: PropsWithChildren): JSX.Element {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  /**
   * A ref wrapper for AlertContext's `showAlert` to avoid effect dependency loops.
   */
  const showAlertRef = useRef<typeof showAlert | null>(null);

  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  /**
   * Fetch all active departments from Supabase.
   */
  const fetchDepartments = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return;
      }

      setDepartments((data ?? []).filter((d) => !isSoftDeletedRow(d)));
    } catch (error: unknown) {
      console.error("Failed to fetch departments:", error);
      showAlertRef.current?.("Failed to fetch departments", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Realtime handler for department changes.
   */
  const handleRealtimeChanges = useCallback(
    (payload: RealtimePostgresChangesPayload<DepartmentRow>): void => {
      if (payload.eventType === "INSERT") {
        setDepartments((prev) => [...prev, payload.new]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new;
        if (isSoftDeletedRow(updated) || updated.active === false) {
          setDepartments((prev) => prev.filter((d) => d.id !== updated.id));
        } else {
          setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        }
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old;
        setDepartments((prev) => prev.filter((d) => d.id !== removed.id));
      }
    },
    []
  );

  /**
   * Initial fetch + realtime subscription.
   */
  useEffect(() => {
    void fetchDepartments();

    const subscription = supabase
      .channel("departments")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "departments" },
        (payload: RealtimePostgresChangesPayload<DepartmentRow>) => {
          handleRealtimeChanges(payload);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchDepartments, handleRealtimeChanges]);

  /**
   * Create a new department.
   */
  const createDepartment = useCallback(
    async (department: DepartmentInsert & { media_url?: string | null }): Promise<Department | undefined> => {
      const { data, error } = await supabase.from("departments").insert(department).select("*").single();

      if (error) {
        showAlertRef.current?.(error.message, "error");
        return undefined;
      }

      return data ?? undefined;
    },
    []
  );

  /**
   * Update an existing department by id.
   */
  const updateDepartment = useCallback(async (department: DepartmentUpdate & { id: string }): Promise<void> => {
    const id = department.id;
    if (id.trim().length === 0) {
      showAlertRef.current?.("Department id is required to update.", "error");
      return;
    }

    const { error } = await supabase.from("departments").update(department).eq("id", id).single();
    if (error) {
      showAlertRef.current?.(error.message, "error");
    }
  }, []);

  /**
   * Soft delete a department by setting active=false.
   */
  const deleteDepartment = useCallback(async (departmentId: string): Promise<void> => {
    if (departmentId.trim().length === 0) {
      showAlertRef.current?.("Department id is required to delete.", "error");
      return;
    }

    try {
      await softDeleteById("departments", departmentId, { setActive: true });
      showAlertRef.current?.("Department deleted successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to delete department:", error);
      showAlertRef.current?.("Failed to delete department", "error");
    }
  }, []);

  /** Restore a soft-deleted department by id. */
  const restoreDepartment = useCallback(async (departmentId: string): Promise<void> => {
    if (departmentId.trim().length === 0) {
      showAlertRef.current?.("Department id is required to restore.", "error");
      return;
    }

    try {
      await restoreById("departments", departmentId, { setActive: true });
      showAlertRef.current?.("Department restored successfully", "success");
    } catch (error: unknown) {
      console.error("Failed to restore department:", error);
      showAlertRef.current?.("Failed to restore department", "error");
    }
  }, []);

  const value = useMemo<DepartmentContextProps>(
    () => ({
      departments,
      loading,
      createDepartment,
      updateDepartment,
      deleteDepartment,
      restoreDepartment,
    }),
    [departments, loading, createDepartment, updateDepartment, deleteDepartment, restoreDepartment]
  );

  return <DepartmentContext.Provider value={value}>{children}</DepartmentContext.Provider>;
}

export function useDepartmentContext(): DepartmentContextProps {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error("useDepartmentContext must be used within a DepartmentProvider");
  }
  return context;
}


