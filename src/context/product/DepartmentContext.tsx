import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../../utils/supabaseClient";
import { Database } from "../../../database.types";
import { useAlertContext } from "../AlertContext";
import type { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

/** Department row CRUD context with realtime sync. */
export type Department = Database["public"]["Tables"]["departments"]["Row"] & { media_url?: string | null };
export type DepartmentInsert = Database["public"]["Tables"]["departments"]["Insert"];
export type DepartmentUpdate = Database["public"]["Tables"]["departments"]["Update"];

interface DepartmentContextProps {
  departments: Department[];
  loading: boolean;
  createDepartment: (department: DepartmentInsert & { media_url?: string | null }) => Promise<Department | undefined>;
  updateDepartment: (department: DepartmentUpdate & { id: string }) => Promise<void>;
  deleteDepartment: (departmentId: string) => Promise<void>;
}

const DepartmentContext = createContext<DepartmentContextProps | undefined>(undefined);

export function DepartmentProvider({ children }: PropsWithChildren): JSX.Element {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    setLoading(true);

    const fetchDepartments = async (): Promise<void> => {
      const { data, error } = await supabase
        .from("departments")
        .select("*")
        .eq("active", true)
        .order("created_at", { ascending: true });

      if (error) {
        showAlert(error.message, "error");
        setLoading(false);
        return;
      }

      setDepartments(data ?? []);
      setLoading(false);
    };

    fetchDepartments();

    const handleChanges = (payload: RealtimePostgresChangesPayload<Department>): void => {
      if (payload.eventType === "INSERT") {
        setDepartments((prev) => [...prev, payload.new as Department]);
      }
      if (payload.eventType === "UPDATE") {
        const updated = payload.new as Department;
        if ((updated as { active?: boolean | null }).active === false) {
          setDepartments((prev) => prev.filter((d) => d.id !== updated.id));
        } else {
          setDepartments((prev) => prev.map((d) => (d.id === updated.id ? updated : d)));
        }
      }
      if (payload.eventType === "DELETE") {
        const removed = payload.old as Department;
        setDepartments((prev) => prev.filter((d) => d.id !== removed.id));
      }
    };

    const subscription = supabase
      .channel("departments")
      .on("postgres_changes", { event: "*", schema: "public", table: "departments" }, (payload: RealtimePostgresChangesPayload<Department>) => handleChanges(payload))
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [showAlert]);

  const createDepartment = async (department: DepartmentInsert & { media_url?: string | null }): Promise<Department | undefined> => {
    const { data, error } = await supabase
      .from("departments")
      .insert(department)
      .select()
      .single();

    if (error) {
      showAlert(error.message, "error");
      return undefined;
    }

    return data as Department;
  };

  const updateDepartment = async (department: DepartmentUpdate & { id: string }): Promise<void> => {
    const { error } = await supabase
      .from("departments")
      .update(department)
      .eq("id", department.id)
      .single();
    if (error) {
      showAlert(error.message, "error");
    }
  };

  const deleteDepartment = async (departmentId: string): Promise<void> => {
    const { error } = await supabase.from("departments").update({ active: false }).eq("id", departmentId);
    if (error) {
      showAlert(error.message, "error");
    }
  };

  return (
    <DepartmentContext.Provider value={{ departments, loading, createDepartment, updateDepartment, deleteDepartment }}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartmentContext(): DepartmentContextProps {
  const context = useContext(DepartmentContext);
  if (!context) {
    throw new Error("useDepartmentContext must be used within a DepartmentProvider");
  }
  return context;
}


