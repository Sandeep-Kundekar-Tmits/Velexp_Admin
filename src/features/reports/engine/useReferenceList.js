import { useMemo } from "react";
import {
  useCustomers,
  useProducts,
  useRegions,
  useServiceCenters,
} from "@/hooks/queries/useReferenceData";

/**
 * Supplies a filter descriptor's options.
 *
 * `source` pulls from the shared reference-data queries, cached for 30 minutes
 * — replacing the per-screen useEffect that refetched GET_USER_API on 33 pages
 * and SERVICE_CENTER on 35.
 *
 * `optionLabel` exists because the label format is NOT uniform: most screens
 * show the customer name, but CODReport shows "name-username". Ignoring that
 * would silently change what the dropdown displays, so when a descriptor asks
 * for a custom label the raw rows are requested and relabelled here.
 *
 * All four hooks are called unconditionally (hooks cannot be conditional) and
 * gated by `enabled`, so only the requested list is actually fetched.
 */
export function useReferenceList(descriptor) {
  const source = descriptor.source;
  const custom = typeof descriptor.optionLabel === "function";
  // With a custom label we need the raw API rows, not the pre-mapped options.
  const raw = custom ? { select: (rows) => rows ?? [] } : {};

  const customers = useCustomers({ ...raw, enabled: source === "customers" });
  const serviceCenters = useServiceCenters({ ...raw, enabled: source === "serviceCenters" });
  const products = useProducts({ ...raw, enabled: source === "products" });
  const regions = useRegions({ ...raw, enabled: source === "regions" });

  const query =
    source === "customers" ? customers
    : source === "serviceCenters" ? serviceCenters
    : source === "products" ? products
    : source === "regions" ? regions
    : null;

  const options = useMemo(() => {
    if (descriptor.options) return descriptor.options;
    const data = query?.data ?? [];
    if (!custom) return data;
    return data
      .filter((row) => {
        const name = row?.customer_name?.trim();
        return name && name !== "null" && name !== "undefined";
      })
      .map((row) => ({ value: row.customer_name, label: descriptor.optionLabel(row) }));
  }, [descriptor, query?.data, custom]);

  return { options, isLoading: Boolean(query?.isLoading) };
}
