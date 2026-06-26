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

import type { Database } from "@/database.types";
import { supabase } from "@/lib/supabase";

type UserDetail = Database["public"]["Tables"]["user_details"]["Row"];

/**
 * Result returned by `signIn` so callers can easily check `result.error`.
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

  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  /**
   * Loads session from AsyncStorage-backed storage and fetches `user_details` when signed in.
   * Expired sessions are cleared via `signOut` (React Native has no session cookies).
   */
  const fetchCurrentUser = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error getting session:", sessionError);
        await supabase.auth.signOut();
        setUser(null);
        setUserDetail(null);
        return;
      }

      const sessionIsExpired =
        typeof session?.expires_at === "number" &&
        session.expires_at < Date.now() / 1000;

      if (sessionIsExpired) {
        await supabase.auth.signOut();
        setUser(null);
        setUserDetail(null);
        prevUserIdRef.current = null;
        return;
      }

      const currentUser = session?.user ?? null;

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

      setUser(currentUser);
      prevUserIdRef.current = currentUser?.id ?? null;
    } finally {
      setLoading(false);
    }
  }, []);

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

      setUser(data.user);
      prevUserIdRef.current = data.user?.id ?? null;

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

  const signOut = useCallback(async (): Promise<SignOutResult> => {
    setLoading(true);

    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
        return { error };
      }

      setUser(null);
      setUserDetail(null);
      prevUserIdRef.current = null;
      return { error: null };
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchCurrentUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const newUser = session?.user ?? null;
      setUser(newUser);
      if (!newUser) {
        prevUserIdRef.current = null;
        setUserDetail(null);
      }
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, [fetchCurrentUser]);

  useEffect(() => {
    if (!user) return;
    const userId = user.id;
    if (userId === prevUserIdRef.current) return;
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (typeof context === "undefined") {
    throw new Error("useAuthContext should be used within the AuthProvider provider!");
  }

  return context;
}
