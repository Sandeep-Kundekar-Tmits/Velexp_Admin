/**
 * Memoized access to the current user's permissions.
 *
 * Replaces calling checkMenuAccess() during render. The resolved Set is
 * rebuilt only when the user or privileges actually change, rather than ~95
 * times per sidebar render.
 */
import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { resolvePermissions } from "./permissions";

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const privileges = useAuthStore((s) => s.privileges);

  return useMemo(() => resolvePermissions(user, privileges), [user, privileges]);
}
