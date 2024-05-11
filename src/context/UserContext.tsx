import React, { createContext, useContext, useEffect, useState, PropsWithChildren } from "react";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";
import { useAlertContext } from "./AlertContext";

export type User = {
  id: string;
  email: string;
  password: string;
  user_detail: Database["public"]["Tables"]["user_details"]["Row"];
};
export type Users = { users: User[] };

interface UserContextProps {
  users: User[];
  loading: boolean;
  addUser: (user: User) => Promise<void>;
  deleteUser: (user: User) => Promise<void>;
  updateUser: (user: User) => Promise<void>;
}

const UserContext = createContext<UserContextProps>(undefined!);

export function UserProvider({ children }: PropsWithChildren) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { showAlert } = useAlertContext();

  useEffect(() => {
    const fetchUsers = async () => {
      const { data: users, error } = await supabase.auth.admin.listUsers()

      if (error) {
        console.error("Error fetching users:", error);
        showAlert("Error fetching users", "error");
        return;
      }

      let usersWithDetails = await Promise.all(
        users.users.map(async (user: any) => {
          const { data: user_detail, error } = await supabase
            .from("user_details")
            .select("*")
            .eq("id", user.id)
            .single();

          if (error) {
            showAlert("Error fetching user details", "error");
            return { ...user, user_detail: null };
          }         

          return { ...user, user_detail};            
        })
      );

      setUsers(usersWithDetails);

      const handleChanges = (payload: any) => {
        if (payload.eventType === 'INSERT') {
          setUsers(prev => [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setUsers(prev => prev.map(user => user.id === payload.new.id ? payload.new : user));
        } else if (payload.eventType === 'DELETE') {
          setUsers(prev => prev.filter(user => user.id !== payload.old.id));
        }
      };
  
      const subscription = supabase
        .channel('auth.users')
        .on('postgres_changes', { event: '*', schema: 'auth', table: 'users' }, payload => {
          handleChanges(payload);
        })
        .subscribe();

      setLoading(false);

      return () => {
        subscription.unsubscribe();
      };
    };

    fetchUsers();
  }, [showAlert]);

  const addUser = async (user: User) => {
    setLoading(true);

    const { data , error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true
    })

    if (error) {
      console.error("Error adding user:", error);
      showAlert("Error adding user", "error");
      setLoading(false);
      return;
    }

    // Create User Details
    const { error: userDetailError } = await supabase
      .from("user_details")
      .insert([{ ...user.user_detail, user_id: data.user.id }]);

    if (userDetailError) {
      console.error("Error adding user details:", userDetailError);
      showAlert("Error adding user details", "error");
      setLoading(false);
      return;
    }

    showAlert("User added successfully", "success");
    setLoading(false);
  };

  const deleteUser = async (user: User) => {
    setLoading(true);

    // Delete User Details
    const { error: userDetailError } = await supabase
      .from("user_details")
      .delete()
      .eq("user_id", user.id);

    if (userDetailError) {
      console.error("Error deleting user details:", userDetailError);
      showAlert("Error deleting user details", "error");
    }

    // Delete Account Balance
    const { error: userError } = await supabase
      .from("account_balances")
      .delete()
      .eq("user_id", user.id);

    if (userError) {
      console.error("Error deleting account balance:", userError);
      showAlert("Error deleting account balance", "error");
    }

    // Delete Baki
    const { error: bakiError } = await supabase
      .from("bakis")
      .delete()
      .eq("user_id", user.id);

    if (bakiError) {
      console.error("Error deleting baki:", bakiError);
      showAlert("Error deleting baki", "error");
    }

    const { error } = await supabase.auth.admin.deleteUser(user.id);

    if (error) {
      console.error("Error deleting user:", error);
      showAlert("Error deleting user", "error");
    }

    showAlert("User deleted successfully", "success"); // "User deleted successfully
    setLoading(false);
  };

  const updateUser = async (user: User) => {
    setLoading(true);
    const { error } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: user.password }
    )

    if (error) {
      console.error("Error updating user:", error);
      showAlert("Error updating user", "error");
      setLoading(false);
      return;
    }

    // Update User Details
    const { error: userDetailError } = await supabase
      .from("user_details")
      .update(user.user_detail)
      .eq("user_id", user.id);

    if (userDetailError) {
      console.error("Error updating user details:", userDetailError);
      showAlert("Error updating user details", "error");
      setLoading(false);
      return;
    }

    showAlert("User updated successfully", "success");
    setLoading(false);
  };

  return (
    <UserContext.Provider value={{ users, loading, addUser, deleteUser, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);

  if (!context) {
    throw new Error("useUserContext must be used within a UserProvider");
  }

  return context;
}