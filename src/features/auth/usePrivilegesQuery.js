/**
 * Keeps the current user's privileges fresh.
 *
 * Until now the privileges tree was frozen in localStorage at login: an admin
 * changing someone's role had no effect until that person logged out and back
 * in. MY_PRIVILEGES_API has existed in src/api/index.js all along but was
 * never called.
 *
 * The stored tree seeds initialData so there is no flash of an empty sidebar,
 * and a successful refetch is written back to the store — which persists it to
 * localStorage, so the legacy consumers that read the key directly
 * (route.jsx, SidebarContent, checkMenuAccess) see the update too.
 *
 * refetchOnWindowFocus/refetchInterval are overridden here, opting back in
 * over the app-wide default (queryClient.js disables both globally, tuned
 * for heavy report queries). This is a small GET, and an admin granting or
 * revoking access for a signed-in user needs to actually reach that user in
 * a reasonable time, not sit stale in cache for up to 5 minutes with no
 * trigger to re-check it at all.
 */
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MY_PRIVILEGES_API } from "@/api";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";
import { useAuthStore } from "@/stores/authStore";

/** The endpoint may answer with a bare array or wrap it. */
function unwrapPrivileges(payload) {
  if (Array.isArray(payload)) return payload;
  return payload?.privileges ?? payload?.menus ?? payload?.results ?? [];
}

export function usePrivilegesQuery(options = {}) {
  const isAuthenticated = useAuthStore((s) => !!s.access || !!s.user);
  const setPrivileges = useAuthStore((s) => s.setPrivileges);

  const query = useQuery({
    queryKey: qk.privileges.me(),
    queryFn: () => http.get(MY_PRIVILEGES_API),
    select: unwrapPrivileges,
    enabled: isAuthenticated,
    initialData: () => {
      const stored = useAuthStore.getState().privileges;
      return stored?.length ? stored : undefined;
    },
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
    ...options,
  });

  const { data, isSuccess, isFetching } = query;

  useEffect(() => {
    // Only mirror real server responses back into the store; skip the
    // initialData pass so we don't rewrite what we just read.
    if (isSuccess && !isFetching && Array.isArray(data)) {
      setPrivileges(data);
    }
  }, [isSuccess, isFetching, data, setPrivileges]);

  return query;
}
