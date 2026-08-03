/**
 * Auth interceptors for the global axios instance.
 *
 * Ten page files (`ShipmentTraceDetail`, `CODReconciliation`, `AllBooking`,
 * `InvoiceFlow`, `ShipmentBilling`, `UpdateWeight`, `CancelShipments`,
 * `InternationalMisReport`, `CODRejectModal`, `BillingAutomation/InvoicesTab`)
 * do `import axios from "axios"` and call it directly, relying on the global
 * default instance carrying the Bearer token.
 *
 * That used to be a side effect of helpers/api_helper.jsx, which was only
 * loaded because helpers/fakebackend_helper.jsx imported it, which was only
 * loaded because four dead Redux sagas imported *that*. Deleting the sagas in
 * Phase 2 would therefore have silently unauthenticated ten screens.
 *
 * This module makes the dependency explicit: main.jsx imports it once, and it
 * shares the same single-flight refresh mutex as src/lib/http.js, so a burst
 * of 401s across axios and fetch still triggers exactly one refresh.
 *
 * Remove this only when those ten files no longer use axios.
 */
import axios from "axios";
import { getAccessToken, isAuthExemptUrl, refreshAccessToken } from "@/helpers/tokenRefresh";

export function installAxiosAuth(instance = axios) {
  instance.interceptors.request.use(
    (config) => {
      const token = getAccessToken();
      if (token) config.headers["Authorization"] = `Bearer ${token}`;
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;

      if (
        status === 401 &&
        originalRequest &&
        !isAuthExemptUrl(originalRequest.url) &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        await refreshAccessToken();
        // The request interceptor re-reads the refreshed token from storage.
        return instance(originalRequest);
      }
      return Promise.reject(error);
    }
  );

  return instance;
}
