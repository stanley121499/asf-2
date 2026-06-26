import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PropsWithChildren } from "react";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { StaffRole } from "@/constants/roles";
import { STAFF_ROLES } from "@/constants/roles";
import { supabase } from "@/lib/supabase";
import { useAuthContext } from "@/context/AuthContext";

const STORAGE_ROLE_KEY = "asf-staff-role";
const STORAGE_USER_KEY = "asf-staff-role-user-id";

function isStaffRole(value: string): value is StaffRole {
  return (STAFF_ROLES as readonly string[]).includes(value);
}

type StaffRoleContextValue = {
  role: StaffRole | null;
  loading: boolean;
  refreshStaffRole: () => Promise<void>;
  setStaffRoleLocal: (nextRole: StaffRole, userId: string) => Promise<void>;
  clearStaffRole: () => Promise<void>;
};

const StaffRoleContext = createContext<StaffRoleContextValue | undefined>(
  undefined
);

/**
 * Tracks the signed-in user's `staff_roles.role` with AsyncStorage hydration.
 */
export function StaffRoleProvider({
  children,
}: PropsWithChildren): React.ReactElement {
  const { user } = useAuthContext();
  const [role, setRole] = useState<StaffRole | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const clearStaffRole = useCallback(async (): Promise<void> => {
    setRole(null);
    await AsyncStorage.removeItem(STORAGE_ROLE_KEY);
    await AsyncStorage.removeItem(STORAGE_USER_KEY);
  }, []);

  const setStaffRoleLocal = useCallback(
    async (nextRole: StaffRole, userId: string): Promise<void> => {
      setRole(nextRole);
      await AsyncStorage.setItem(STORAGE_ROLE_KEY, nextRole);
      await AsyncStorage.setItem(STORAGE_USER_KEY, userId);
    },
    []
  );

  const refreshStaffRole = useCallback(async (): Promise<void> => {
    const uid = user?.id;
    if (typeof uid !== "string" || uid.length === 0) {
      await clearStaffRole();
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const storedUserId = await AsyncStorage.getItem(STORAGE_USER_KEY);
      const storedRole = await AsyncStorage.getItem(STORAGE_ROLE_KEY);
      if (
        storedUserId === uid &&
        typeof storedRole === "string" &&
        isStaffRole(storedRole)
      ) {
        setRole(storedRole);
      }

      const { data, error } = await supabase
        .from("staff_roles")
        .select("role")
        .eq("user_id", uid)
        .maybeSingle();

      if (error) {
        setLoading(false);
        return;
      }

      const rawRole = data?.role;
      if (typeof rawRole !== "string" || !isStaffRole(rawRole)) {
        await supabase.auth.signOut();
        await clearStaffRole();
        return;
      }

      await setStaffRoleLocal(rawRole, uid);
    } finally {
      setLoading(false);
    }
  }, [user?.id, clearStaffRole, setStaffRoleLocal]);

  useEffect(() => {
    void refreshStaffRole();
  }, [refreshStaffRole]);

  const value = useMemo<StaffRoleContextValue>(
    () => ({
      role,
      loading,
      refreshStaffRole,
      setStaffRoleLocal,
      clearStaffRole,
    }),
    [role, loading, refreshStaffRole, setStaffRoleLocal, clearStaffRole]
  );

  return (
    <StaffRoleContext.Provider value={value}>
      {children}
    </StaffRoleContext.Provider>
  );
}

export function useStaffRole(): StaffRoleContextValue {
  const ctx = useContext(StaffRoleContext);
  if (ctx === undefined) {
    throw new Error("useStaffRole must be used within StaffRoleProvider");
  }
  return ctx;
}
