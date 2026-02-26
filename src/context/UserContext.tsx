import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import type { User as SupabaseAuthUser } from "@supabase/supabase-js";
import { supabase, supabaseAdmin } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";

export type User = {
  id: string;
  email: string;
  password: string;
  /**
   * NOTE: We never fetch/store real passwords from Supabase.
   * This field is only used as an input for create/update flows.
   */
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

export function UserProvider({ children }: PropsWithChildren) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  /**
   * Fetch all users from Supabase auth and enrich them with `user_details`.
   */
  const fetchUsers = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers();

      if (error) {
        console.error("Error fetching users:", error);
        showAlert("Error fetching users", "error");
        return;
      }

      const authUsers: SupabaseAuthUser[] = data.users ?? [];

      // Build app-friendly `User` objects (password is never returned by Supabase).
      const usersWithDetails: User[] = await Promise.all(
        authUsers.map(async (authUser) => {
          const { data: detail, error: detailError } = await supabase
            .from("user_details")
            .select("*")
            .eq("id", authUser.id)
            .maybeSingle();

          if (detailError) {
            console.error("Error fetching user details:", detailError);
            showAlert("Error fetching user details", "error");
          }

          // Ensure we always have a role field for UI safety.
          const role = typeof detail?.role === "string" && detail.role.trim().length > 0 ? detail.role : "USER";

          return {
            id: authUser.id,
            email: authUser.email ?? "",
            password: "",
            user_detail: {
              ...detail,
              role,
            },
          };
        })
      );

      setUsers(usersWithDetails);
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Realtime handler for auth user changes.
   *
   * We re-fetch from admin APIs so the UI always has the enriched `user_detail` data.
   */
  const handleAuthUsersRealtime = useCallback((): void => {
    void fetchUsers();
  }, [fetchUsers]);

  // Initial fetch and realtime subscription.
  useEffect(() => {
    void fetchUsers();

    const subscription = supabase
      .channel("auth.users")
      .on("postgres_changes", { event: "*", schema: "auth", table: "users" }, () => {
        handleAuthUsersRealtime();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUsers, handleAuthUsersRealtime]);

  /**
   * Creates a new auth user and a corresponding `user_details` record.
   */
  const addUser = useCallback(async (user: User): Promise<void> => {
    setLoading(true);

    try {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
      });

      if (error) {
        console.error("Error adding user:", error);
        showAlert("Error adding user", "error");
        return;
      }

      // Create User Details (user_details primary key is the auth user id).
      const { error: userDetailError } = await supabase.from("user_details").insert([
        {
          ...user.user_detail,
          id: data.user.id,
        },
      ]);

      if (userDetailError) {
        console.error("Error adding user details:", userDetailError);
        showAlert("Error adding user details", "error");
        return;
      }

      showAlert("User added successfully", "success");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Deletes a user (details row first, then auth user).
   */
  const deleteUser = useCallback(async (user: User): Promise<void> => {
    setLoading(true);

    try {
      // Delete User Details
      const { error: userDetailError } = await supabase
        .from("user_details")
        .delete()
        .eq("id", user.id);

      if (userDetailError) {
        console.error("Error deleting user details:", userDetailError);
        showAlert("Error deleting user details", "error");
        return;
      }

      // Delete Auth user
      const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);

      if (error) {
        console.error("Error deleting user:", error);
        showAlert("Error deleting user", "error");
        return;
      }

      showAlert("User deleted successfully", "success");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  /**
   * Updates a user password and updates their user_details record.
   */
  const updateUser = useCallback(async (user: User): Promise<void> => {
    setLoading(true);

    try {
      // Update auth user password (only if provided)
      if (typeof user.password === "string" && user.password.trim().length > 0) {
        const { error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
          password: user.password,
        });

        if (error) {
          console.error("Error updating user:", error);
          showAlert("Error updating user", "error");
          return;
        }
      }

      // Update User Details (avoid attempting to update the primary key `id`)
      const { id: _ignoredId, ...detailUpdate } = user.user_detail;
      const { error: userDetailError } = await supabase
        .from("user_details")
        .update(detailUpdate)
        .eq("id", user.id);

      if (userDetailError) {
        console.error("Error updating user details:", userDetailError);
        showAlert("Error updating user details", "error");
        return;
      }

      showAlert("User updated successfully", "success");
    } finally {
      setLoading(false);
    }
  }, [showAlert]);

  // Memoize the value to prevent unnecessary re-renders in consumers.
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
