/**
 * Shared reference-data queries for filter dropdowns.
 *
 * Each list is fetched once and cached for 30 minutes, so navigating between
 * report screens no longer refires them. The `{ value, label }` shaping runs
 * in `select`, which keeps the transform out of every component and means it
 * is recomputed only when the underlying data actually changes.
 *
 * Usage mirrors what the screens already do, minus the useEffect plumbing:
 *
 *   const { data: customers = [], isLoading } = useCustomers();
 */
import { useQuery } from "@tanstack/react-query";
import { qk } from "@/lib/queryKeys";
import {
  fetchCustomers,
  fetchProducts,
  fetchRegions,
  fetchServiceCenters,
  fetchTrackingStatuses,
  toCustomerOptions,
  toProductOptions,
  toRegionOptions,
  toServiceCenterOptions,
  toStatusOptions,
} from "@/services/reference.service";

/** Reference lists change rarely; a stale read is fine, a refetch storm is not. */
const REFERENCE_STALE_TIME = 30 * 60_000;

export function useCustomers(options = {}) {
  return useQuery({
    queryKey: qk.reference.customers(),
    queryFn: fetchCustomers,
    select: toCustomerOptions,
    staleTime: REFERENCE_STALE_TIME,
    ...options,
  });
}

export function useServiceCenters(options = {}) {
  return useQuery({
    queryKey: qk.reference.serviceCenters(),
    queryFn: fetchServiceCenters,
    select: toServiceCenterOptions,
    staleTime: REFERENCE_STALE_TIME,
    ...options,
  });
}

export function useProducts(options = {}) {
  return useQuery({
    queryKey: qk.reference.products(),
    queryFn: fetchProducts,
    select: toProductOptions,
    staleTime: REFERENCE_STALE_TIME,
    ...options,
  });
}

export function useRegions(options = {}) {
  return useQuery({
    queryKey: qk.reference.regions(),
    queryFn: fetchRegions,
    select: toRegionOptions,
    staleTime: REFERENCE_STALE_TIME,
    ...options,
  });
}

/**
 * Known tracking-status codes, for the Correct Tracking Row dropdown. Backed
 * by an endpoint with no confirmed prior consumer in this app -- callers
 * should treat an empty result as "list unavailable" and fall back to a free
 * text field rather than rendering an empty, unusable <select>.
 */
export function useTrackingStatuses(options = {}) {
  return useQuery({
    queryKey: qk.reference.trackingStatuses(),
    queryFn: fetchTrackingStatuses,
    select: toStatusOptions,
    staleTime: REFERENCE_STALE_TIME,
    retry: 1,
    ...options,
  });
}
