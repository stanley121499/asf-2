import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";

import type { Database } from "@/database.types";
import { supabase } from "@/lib/supabase";

import { useAlertContext } from "./AlertContext";

export type User = {
  id: string;
  email: string;
  password: string;
  user_detail: Partial<Database["public"]["Tables"]["user_details"]["Row"]> & {
    role: Database["public"]["Tables"]["user_details"]["Row"]["role"];
  };
};
export type Users = { users: User[] };

interface UserContextProps {
  users: User[];
  loading: boolean;
  addUser: (user: User) => Promise<void>;
  deleteUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const UserContext = createContext<UserContextProps | undefined>(undefined);

function displayNameFromDetail(
  detail: Database["public"]["Tables"]["user_details"]["Row"] | null | undefined
): string {
  if (!detail) {
    return "";
  }
  const first =
    typeof detail.first_name === "string" ? detail.first_name.trim() : "";
  const last =
    typeof detail.last_name === "string" ? detail.last_name.trim() : "";
  const combined = `${first} ${last}`.trim();
  return combined.length > 0 ? combined : "";
}

/**
 * Lists customers from `user_details` using the anon Supabase client (RLS).
 * Auth admin APIs are not available on mobile — full account provisioning remains on web admin.
 */
export function UserProvider({ children }: PropsWithChildren) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  const showAlertRef = useRef<typeof showAlert | null>(null);
  useEffect(() => {
    showAlertRef.current = showAlert;
  }, [showAlert]);

  const fetchUsers = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const { data: rows, error } = await supabase
        .from("user_details")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        showAlertRef.current?.(error.message, "error");
        setUsers([]);
        return;
      }

      const mapped: User[] = (rows ?? []).map((row) => {
        const role =
          typeof row.role === "string" && row.role.trim().length > 0
            ? row.role
            : "USER";
        const name = displayNameFromDetail(row);
        const emailFallback =
          name.length > 0 ? name : `user-${row.id.slice(0, 8)}`;
        return {
          id: row.id,
          email: emailFallback,
          password: "",
          user_detail: { ...row, role },
        };
      });

      setUsers(mapped);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUsers();

    const channel = supabase
      .channel("staff-user-details")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "user_details" },
        () => {
          void fetchUsers();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [fetchUsers]);

  const addUser = useCallback(async (_user: User): Promise<void> => {
    showAlertRef.current?.(
      "Creating accounts is not available in the staff app. Use the web admin panel.",
      "warning"
    );
  }, []);

  const deleteUser = useCallback(async (_user: User): Promise<void> => {
    showAlertRef.current?.(
      "Deleting auth users is not available in the staff app. Use the web admin panel.",
      "warning"
    );
  }, []);

  const updateUser = useCallback(async (user: User): Promise<void> => {
    setLoading(true);

    try {
      if (typeof user.password === "string" && user.password.trim().length > 0) {
        showAlertRef.current?.(
          "Password changes from the staff app are not supported. Use the web admin.",
          "warning"
        );
        return;
      }

      const { id: _ignoredId, ...detailUpdate } = user.user_detail;
      const { error: userDetailError } = await supabase
        .from("user_details")
        .update(detailUpdate)
        .eq("id", user.id);

      if (userDetailError) {
        showAlertRef.current?.(userDetailError.message, "error");
        return;
      }

      showAlertRef.current?.("User updated successfully", "success");
      await fetchUsers();
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const value = useMemo<UserContextProps>(
    () => ({
      users,
      loading,
      addUser,
      deleteUser,
      updateUser,
    }),
    [users, loading, addUser, deleteUser, updateUser]
  );

  return (
    <UserContext.Provider value={value}>{children}</UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }

  return context;
}
