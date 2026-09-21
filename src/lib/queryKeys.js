/**
 * Central query-key factory.
 *
 * Keys are built here rather than inline so that invalidation is reliable:
 * `queryClient.invalidateQueries({ queryKey: qk.reference.all })` clears every
 * reference list, and a typo can't silently create a second cache entry that
 * never gets invalidated.
 *
 * Convention: broadest scope first, narrowing left to right, so prefix
 * matching does the right thing.
 */
export const qk = {
  /** Slow-moving dropdown data, shared across dozens of report screens. */
  reference: {
    all: ["reference"],
    customers: () => ["reference", "customers"],
    serviceCenters: () => ["reference", "service-centers"],
    products: () => ["reference", "products"],
    regions: () => ["reference", "regions"],
    trackingStatuses: () => ["reference", "tracking-statuses"],
    serviceCentreDirectory: () => ["reference", "service-centre-directory"],
    departments: () => ["reference", "departments"],
    designations: () => ["reference", "designations"],
  },

  /** Current user's resolved menu privileges (Phase 2). */
  privileges: {
    all: ["privileges"],
    me: () => ["privileges", "me"],
  },

  /**
   * Report results, keyed by the exact filter payload sent to the backend.
   * Two different filter sets are two different cache entries, which is what
   * makes the "press Check" flow cacheable at all.
   */
  reports: {
    all: ["reports"],
    byKey: (reportKey) => ["reports", reportKey],
    result: (reportKey, payload) => ["reports", reportKey, payload],
  },
};
