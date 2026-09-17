/**
 * Reference data — the slow-moving lists that populate filter dropdowns on
 * almost every report screen.
 *
 * Before this existed each screen called the endpoint itself on mount:
 * GET_USER_API was refetched on 33 pages and SERVICE_CENTER on 35, with no
 * caching, so moving between two reports refetched everything.
 *
 * The `{ value, label }` mapping lives here too. It used to be duplicated in
 * a useEffect on every screen — including the null-name filter below, which
 * appeared verbatim in 22 files.
 */
import { DEPARTMENT_LIST, GET_ALL_REGION, GET_ALL_STATUSES, GET_USER_API, PRODUCT_LIST, SERVICE_CENTER, SERVICE_CENTER_LIST } from "@/api";
import { http } from "@/lib/http";

/** Same "get-list" envelope every sibling endpoint in this family uses -- see toStatusOptions. */
const unwrapGetList = (raw) => Array.isArray(raw) ? raw
  : Array.isArray(raw?.results?.results) ? raw.results.results
  : Array.isArray(raw?.results) ? raw.results
  : Array.isArray(raw?.data) ? raw.data
  : [];

/**
 * The customer list contains rows whose name is genuinely missing and rows
 * where it is the *string* "null"/"undefined" from upstream serialization.
 * Both must be dropped or they render as selectable options.
 */
export function toCustomerOptions(rows) {
  return (rows ?? [])
    .filter((row) => {
      const name = row?.customer_name?.trim();
      return name && name !== "null" && name !== "undefined";
    })
    .map((row) => ({ value: row.customer_name, label: row.customer_name }));
}

export function toServiceCenterOptions(rows) {
  return (rows ?? []).map((row) => ({ value: row?.ec_code, label: row?.ec_code }));
}

export function toProductOptions(rows) {
  return (rows ?? []).map((row) => ({ value: row?.name, label: row?.name }));
}

/** Regions arrive with case-variant duplicates; collapse them. */
export function toRegionOptions(rows) {
  const seen = new Set();
  const options = [];
  for (const row of rows ?? []) {
    const value = row?.region;
    if (!value) continue;
    const key = String(value).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    options.push({ value, label: value });
  }
  return options;
}

/**
 * GET_ALL_STATUSES has no confirmed consumer elsewhere in the app, and this
 * backend isn't consistent about how a "get-list" endpoint wraps its array
 * (flat array, {data: [...]}, {results: [...]}, or the doubly-nested
 * {results: {results: [...]}} that /designations/get-list/ uses -- the same
 * pattern GET_ALL_STATUSES turned out to follow, see fetchTrackingStatuses)
 * -- so every shape is tried, and each entry can be a bare code string or an
 * object. A description, when the backend sends one under any of the common
 * key names, is appended to the label so the dropdown reads as "OFD --
 * Out For Delivery" instead of a bare code; the submitted value is always
 * just the code.
 */
export function toStatusOptions(raw) {
  const list = Array.isArray(raw) ? raw
    : Array.isArray(raw?.data) ? raw.data
    : Array.isArray(raw?.results?.results) ? raw.results.results
    : Array.isArray(raw?.results) ? raw.results
    : Array.isArray(raw?.statuses) ? raw.statuses
    : [];

  const seen = new Set();
  const options = [];
  list.forEach((item) => {
    const code = typeof item === "string" ? item : (item?.status ?? item?.code ?? item?.value ?? item?.name);
    if (!code || seen.has(code)) return;
    seen.add(code);

    const description = typeof item === "string" ? null
      : item?.description ?? item?.status_description ?? item?.desc ?? item?.display_name ?? item?.remarks ?? item?.label;
    options.push({ value: code, label: description && description !== code ? `${code} — ${description}` : code });
  });
  return options.sort((a, b) => a.value.localeCompare(b.value));
}

/**
 * Full service-centre directory (id, code, company name, ...) -- distinct from
 * toServiceCenterOptions above, which is the lighter `unique-service-centers/` list keyed
 * only by ec_code with no id. Used wherever a form needs to submit a service centre's id
 * (Employee Management) rather than just filter by its code.
 */
export function toServiceCentreDirectoryOptions(raw) {
  return unwrapGetList(raw).map((sc) => ({
    value: sc?.id,
    label: `${sc?.service_center_code || ""} — ${sc?.company_name || ""}`,
  }));
}

export function toDepartmentOptions(raw) {
  return unwrapGetList(raw).map((dept) => ({ value: dept?.id, label: dept?.name }));
}

// GET_USER_API needs the trailing slash; the constant omits it because other
// call sites append an id.
export const fetchCustomers = () => http.get(`${GET_USER_API}/`);
export const fetchServiceCenters = () => http.get(SERVICE_CENTER);
export const fetchProducts = () => http.get(PRODUCT_LIST);
export const fetchRegions = () => http.get(GET_ALL_REGION);
// Despite the "GET_" constant name, /status/get-list/ rejects GET with 405 -- same
// "get-list" family as /designations/get-list/ (GET_ALL_ROLES), which is also POSTed to
// with an empty body elsewhere in the app.
export const fetchTrackingStatuses = () => http.post(GET_ALL_STATUSES, {});
export const fetchServiceCentreDirectory = () => http.post(SERVICE_CENTER_LIST, {});
export const fetchDepartments = () => http.post(DEPARTMENT_LIST, {});
