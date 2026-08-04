import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/http";
import { qk } from "@/lib/queryKeys";

/**
 * Runs a report's query with the legacy fetch-on-Check semantics.
 *
 * Report screens deliberately do NOT fetch on mount or on filter change: the
 * user sets filters and presses Check, because these endpoints can return
 * 50k-row result sets. That behaviour is preserved by keeping the query
 * disabled until a payload is submitted.
 *
 * Results are cached per payload, so pressing Check twice with the same
 * filters is served from cache instead of re-querying — the one behavioural
 * improvement, and a safe one.
 *
 * @param {import("./types").ReportConfig} config
 */
export function useReportQuery(config) {
  const [payload, setPayload] = useState(null);
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: qk.reports.result(config.key, payload),
    queryFn: () => http.post(config.endpoint, payload),
    enabled: payload !== null,
    select: config.select ?? ((res) => res?.bookings ?? []),
    // A report is a point-in-time answer for a filter set; refetching it
    // behind the user's back would be surprising and expensive.
    staleTime: Infinity,
    gcTime: 5 * 60_000,
  });

  const run = useCallback((nextPayload) => setPayload(nextPayload), []);

  const reset = useCallback(() => {
    setPayload(null);
    queryClient.removeQueries({ queryKey: qk.reports.byKey(config.key) });
  }, [config.key, queryClient]);

  return {
    ...query,
    rows: query.data ?? [],
    payload,
    hasRun: payload !== null,
    run,
    reset,
  };
}
