import type { PropsWithChildren } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { AuthError, User } from "@supabase/supabase-js";
import { supabase } from "../utils/supabaseClient";
import { Database } from "../../database.types";

type UserDetail = Database["public"]["Tables"]["user_details"]["Row"];

/**
 * Result returned by `signIn` so callers can easily check `result.error`.
 * This preserves the existing callsites pattern:
 * `if (result.error) { ... } else { ... }`
 */
export type SignInResult = {
  user: User | null;
  error: AuthError | null;
};

/**
 * Result returned by `signOut` so UIs can optionally inspect errors.
 */
export type SignOutResult = {
  error: AuthError | null;
};

interface AuthContextProps {
  user: User | null;
  user_detail: UserDetail | null;
  signIn: (email: string, password: string) => Promise<SignInResult>;
  signOut: () => Promise<SignOutResult>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [user_detail, setUserDetail] = useState<UserDetail | null>(null);

  /**
   * Fetches the current authenticated user and (if present) their `user_details` row.
   */
  const fetchCurrentUser = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      // Step 1: get the current user from Supabase auth
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        console.error("Error getting user:", userError);
        setUser(null);
        setUserDetail(null);
        return;
      }

      // Step 2: fetch user_details if we have a user
      if (currentUser) {
        const { data: detail, error: detailError } = await supabase
          .from("user_details")
          .select("*")
          .eq("id", currentUser.id)
          .maybeSingle();

        if (detailError) {
          console.error("Error fetching user details:", detailError);
          setUserDetail(null);
        } else {
          setUserDetail(detail);
        }
      } else {
        setUserDetail(null);
      }

      // Step 3: set user state last to reduce intermediate re-renders
      setUser(currentUser);
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Signs a user in with email/password. Returns `{ user, error }` for simple callsite checks.
   */
  const signIn = useCallback(async (email: string, password: string): Promise<SignInResult> => {
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Error during sign in:", error);
        return { user: null, error };
      }

      // Keep state in sync with Supabase response.
      setUser(data.user);

      // Fetch user_detail after sign-in (if we have a user id).
      if (data.user) {
        const { data: detail, error: detailError } = await supabase
          .from("user_details")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle();

        if (detailError) {
          console.error("Error fetching user details after sign in:", detailError);
          setUserDetail(null);
        } else {
          setUserDetail(detail);
        }
      } else {
        setUserDetail(null);
      }

      return { user: data.user, error: null };
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Signs the current user out.
   */
  const signOut = useCallback(async (): Promise<SignOutResult> => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        return { error };
      }

      // Clear local auth state
      setUser(null);
      setUserDetail(null);
      return { error: null };
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize current user state and listen for auth changes.
  useEffect(() => {
    void fetchCurrentUser();

    const { data: listener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Keep `user` in sync
      const newUser = session?.user ?? null;
      setUser(newUser);

      // Only fetch user_detail if user changed (not on every session refresh)
      if (newUser && newUser.id !== user?.id) {
        const { data: detail, error: detailError } = await supabase
          .from("user_details")
          .select("*")
          .eq("id", newUser.id)
          .maybeSingle();

        if (detailError) {
          console.error("Error fetching user details:", detailError);
          setUserDetail(null);
        } else {
          setUserDetail(detail);
        }
      } else if (!newUser) {
        setUserDetail(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [fetchCurrentUser, user?.id]);

  // Memoize value to avoid forcing rerenders of every consumer on unrelated renders.
  const value = useMemo<AuthContextProps>(
    () => ({
      user,
      user_detail,
      signIn,
      signOut,
      loading,
    }),
    [user, user_detail, signIn, signOut, loading]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (typeof context === "undefined") {
    throw new Error(
      "useAuthContext should be used within the AuthProvider provider!"
    );
  }

  return context;
}

