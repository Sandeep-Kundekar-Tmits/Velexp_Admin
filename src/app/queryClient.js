import { QueryClient } from "@tanstack/react-query";
import { HttpError } from "@/lib/http";

/**
 * Defaults tuned for this app specifically.
 *
 * refetchOnWindowFocus is off: report queries POST a filter payload and can
 * return 50k-row result sets, so silently re-firing them when someone alt-tabs
 * back would be expensive and surprising.
 *
 * gcTime is deliberately short. Report results are keyed by their filter
 * payload, so a user working through a shift accumulates many large cached
 * arrays; without this the tab's memory grows all day.
 *
 * 401s are never retried here — src/lib/http.js already performs one
 * refresh-and-retry, and if that failed the session is gone.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      retry: (failureCount, error) => {
        if (error instanceof HttpError) {
          if (error.status === 401 || error.status === 403) return false;
          if (error.status >= 400 && error.status < 500) return false;
        }
        return failureCount < 1;
      },
    },
    mutations: {
      retry: false,
    },
  },
});
