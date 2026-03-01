import type { PropsWithChildren } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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

  // Use a ref to track the previous user id so the onAuthStateChange listener
  // doesn't need user?.id in the dependency array (which caused an infinite loop).
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  /**
   * Fetches the current authenticated user and (if present) their `user_details` row.
   *
   * Because the Supabase client uses `autoRefreshToken: false` (see supabaseClient.ts),
   * `getSession()` returns immediately without any network round-trip. However it may
   * return an already-expired session stored in localStorage. We detect and discard
   * those here so the user is redirected to sign-in instead of being silently stuck
   * in an authenticated-but-401 state.
   */
  const fetchCurrentUser = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      // Use getSession() instead of getUser() — the service_role key has no `sub` claim,
      // so getUser() always returns 403 "invalid claim: missing sub claim".
      // getSession() reads the user session from local storage which works correctly
      // regardless of which API key the Supabase client is configured with.
      //
      // With autoRefreshToken: false (see supabaseClient.ts) this call returns
      // immediately without any network round-trip, even for expired sessions.
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        setUser(null);
        setUserDetail(null);
        return;
      }

      // With autoRefreshToken: false, getSession() may return an expired session
      // directly (no network refresh attempt).  Treat expired sessions as "no
      // session" so the user is prompted to sign in again rather than ending up
      // in an indeterminate state where the UI thinks they're logged in but every
      // API request returns 401.
      const sessionIsExpired =
        typeof session?.expires_at === "number" &&
        session.expires_at < Date.now() / 1000;

      if (sessionIsExpired) {
        // Clear the stale entry from localStorage to speed up the next check.
        localStorage.removeItem("sb-app-session");
        setUser(null);
        setUserDetail(null);
        prevUserIdRef.current = null;
        return;
      }

      const currentUser = session?.user ?? null;

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
      prevUserIdRef.current = currentUser?.id ?? null;
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
      prevUserIdRef.current = data.user?.id ?? null;

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
      prevUserIdRef.current = null;
      return { error: null };
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize current user state and listen for auth changes.
  //
  // IMPORTANT: the onAuthStateChange callback must NOT call any supabase.*
  // methods (getSession, from, etc.).  Those calls internally await
  // `initializePromise`, which is still pending while _notifyAllSubscribers
  // is running inside _initialize()'s lock — causing a permanent navigator.locks
  // deadlock that silently hangs every data fetch in the app.
  //
  // user_details is fetched in the separate useEffect below that reacts to
  // user?.id changes, safely outside the auth lock.
  useEffect(() => {
    void fetchCurrentUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Synchronous — only update React state, no Supabase calls.
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (!newUser) {
        prevUserIdRef.current = null;
        setUserDetail(null);
      }
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, [fetchCurrentUser]); // ← fetchCurrentUser is stable (no deps), so this only runs once

  // Fetch user_detail whenever the authenticated user ID changes.
  // This runs outside the auth lock so supabase.from() can proceed safely.
  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    if (userId === prevUserIdRef.current) return; // already fetched for this user
    prevUserIdRef.current = userId;

    supabase
      .from("user_details")
      .select("*")
      .eq("id", userId)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Error fetching user details:", error);
          setUserDetail(null);
        } else {
          setUserDetail(data);
        }
      });
  }, [user]);

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
