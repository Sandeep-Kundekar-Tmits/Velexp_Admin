/**
 * The single HTTP transport for the app.
 *
 * Replaces three overlapping mechanisms that existed before:
 *   1. a global `window.fetch` monkey-patch in main.jsx
 *   2. axios interceptors on both a custom instance and the global default
 *   3. six bespoke `use*ApiCall` hooks calling bare fetch
 *
 * Auth behaviour is unchanged: the Bearer token comes from
 * localStorage["authUser"].access, and a 401 triggers exactly one refresh
 * (shared via the single-flight mutex in helpers/tokenRefresh) followed by
 * one retry.
 *
 * Two layers, deliberately:
 *   - `rawRequest` never throws on an HTTP status. The legacy hooks have
 *     subtly different error contracts (usePostApiCall returns the error
 *     body, useGetApiCall returns null) and they need to keep them.
 *   - `http.*` throws HttpError on non-2xx. New code should use these.
 */
import { BASE_URL } from "@/config/env";
import { getAccessToken, isAuthExemptUrl, refreshAccessToken } from "@/helpers/tokenRefresh";

export class HttpError extends Error {
  constructor(status, body, url) {
    super(body?.error || body?.msg || body?.detail || body?.message || `HTTP ${status}`);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
    this.url = url;
  }
}

/** Absolute URLs pass through; root-relative paths get BASE_URL prefixed. */
export function resolveUrl(url) {
  const target = String(url ?? "");
  return /^https?:\/\//i.test(target) ? target : `${BASE_URL}${target}`;
}

function buildHeaders({ body, headers }) {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const token = getAccessToken();
  return {
    // Never set Content-Type for FormData — the browser must supply the
    // multipart boundary itself.
    ...(isForm || body === undefined ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };
}

function serializeBody(body) {
  if (body === undefined) return undefined;
  if (typeof FormData !== "undefined" && body instanceof FormData) return body;
  if (typeof body === "string") return body;
  return JSON.stringify(body);
}

/**
 * Drop-in replacement for `fetch`: same signature, same raw Response back,
 * but with the Bearer token, credentials and 401 refresh-and-retry applied.
 *
 * This is what the former global window.fetch patch did, except it is
 * explicit at each call site and does not mutate the caller's options.
 * Existing code that inspects `response.ok` / `.status` / `.json()` /
 * `.blob()` keeps working with only the identifier changed.
 *
 * @type {typeof fetch}
 */
export async function authFetch(url, options = {}, _retried = false) {
  const { body, headers, ...rest } = options;

  const response = await fetch(resolveUrl(url), {
    credentials: "include",
    headers: buildHeaders({ body, headers }),
    ...(body !== undefined ? { body: serializeBody(body) } : {}),
    ...rest,
  });

  if (response.status === 401 && !isAuthExemptUrl(resolveUrl(url)) && !_retried) {
    // refreshAccessToken() is single-flight: concurrent 401s share one refresh.
    // On failure it clears the session and redirects, then rethrows.
    await refreshAccessToken();
    return authFetch(url, options, true);
  }

  return response;
}

/**
 * Performs the request and parses the body. Resolves with
 * { ok, status, data, response } for any HTTP status; only network failures
 * and malformed JSON reject.
 *
 * `options` is never mutated — the retry re-derives everything from the
 * original arguments, unlike the old patch which set a flag on the caller's
 * own object.
 */
export async function rawRequest(url, options = {}) {
  const { method = "GET", parseMode = "json", ...rest } = options;

  const response = await authFetch(url, { method, ...rest });

  const text = await response.text();
  let data = null;
  if (text) {
    if (parseMode === "contentType") {
      // Only parse when the server says it's JSON. Used by the DELETE hook,
      // whose endpoints return 204 or non-JSON bodies.
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) data = JSON.parse(text);
    } else {
      // Strict, matching the previous `await response.json()`: malformed
      // JSON throws and the caller's catch handles it. An empty body
      // yields null instead of throwing, which is the one deliberate
      // improvement over the old behaviour.
      data = JSON.parse(text);
    }
  }
  return { ok: response.ok, status: response.status, data, response };
}

/** Throwing wrapper — preferred for all new code. */
export async function request(url, options = {}) {
  const { ok, status, data } = await rawRequest(url, options);
  if (!ok) throw new HttpError(status, data, resolveUrl(url));
  return data;
}

export const http = {
  get: (url, options) => request(url, { ...options, method: "GET" }),
  post: (url, body, options) => request(url, { ...options, method: "POST", body }),
  put: (url, body, options) => request(url, { ...options, method: "PUT", body }),
  patch: (url, body, options) => request(url, { ...options, method: "PATCH", body }),
  del: (url, options) => request(url, { ...options, method: "DELETE" }),
};
