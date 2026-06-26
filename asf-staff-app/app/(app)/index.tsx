import { Redirect } from "expo-router";

import { initialHrefForRole } from "@/constants/navigation";
import { useStaffRole } from "@/context/StaffRoleContext";

/**
 * Opens the correct first tab for the authenticated staff role.
 */
export default function AppEntryRedirect(): React.ReactElement | null {
  const { role } = useStaffRole();

  if (role === null) {
    return null;
  }

  return <Redirect href={initialHrefForRole(role)} />;
}
