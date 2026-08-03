import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ BASE_URL: "https://api.test", SECRET_KEY: "x" }));

const refreshAccessToken = vi.fn();
vi.mock("@/helpers/tokenRefresh", () => ({
  getAccessToken: () => globalThis.__token ?? null,
  isAuthExemptUrl: (u) => String(u).includes("/api_login/"),
  refreshAccessToken: (...a) => refreshAccessToken(...a),
}));

const { rawRequest, request, http, HttpError, resolveUrl } = await import("@/lib/http");

const jsonResponse = (body, { status = 200, contentType = "application/json" } = {}) =>
  new Response(body === undefined ? "" : JSON.stringify(body), {
    status,
    headers: contentType ? { "content-type": contentType } : {},
  });

beforeEach(() => {
  globalThis.__token = "tok-1";
  refreshAccessToken.mockReset();
  globalThis.fetch = vi.fn();
});
afterEach(() => vi.restoreAllMocks());

describe("resolveUrl", () => {
  it("prefixes relative paths with BASE_URL", () => {
    expect(resolveUrl("/users")).toBe("https://api.test/users");
  });
  it("leaves absolute URLs untouched", () => {
    expect(resolveUrl("https://other.example/x")).toBe("https://other.example/x");
  });
});

describe("rawRequest", () => {
  it("sends the Bearer token and credentials", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ ok: 1 }));
    await rawRequest("/x");
    const [, init] = fetch.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer tok-1");
    expect(init.credentials).toBe("include");
  });

  it("omits Authorization when there is no token", async () => {
    globalThis.__token = null;
    fetch.mockResolvedValueOnce(jsonResponse({ ok: 1 }));
    await rawRequest("/x");
    expect(fetch.mock.calls[0][1].headers.Authorization).toBeUndefined();
  });

  it("sets JSON content-type and serializes the body", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}));
    await rawRequest("/x", { method: "POST", body: { a: 1 } });
    const [, init] = fetch.mock.calls[0];
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe('{"a":1}');
  });

  it("does NOT set Content-Type for FormData (browser supplies the boundary)", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}));
    const form = new FormData();
    form.append("f", "v");
    await rawRequest("/upload", { method: "POST", body: form });
    const [, init] = fetch.mock.calls[0];
    expect(init.headers["Content-Type"]).toBeUndefined();
    expect(init.body).toBe(form);
  });

  it("returns ok:false rather than throwing on HTTP errors", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ error: "nope" }, { status: 400 }));
    const res = await rawRequest("/x");
    expect(res).toMatchObject({ ok: false, status: 400, data: { error: "nope" } });
  });

  it("treats an empty body as null instead of throwing", async () => {
    // A 204 Response cannot carry a body at all, hence null rather than "".
    fetch.mockResolvedValueOnce(new Response(null, { status: 204 }));
    expect((await rawRequest("/x")).data).toBeNull();
  });

  it("parseMode 'contentType' skips parsing non-JSON bodies", async () => {
    fetch.mockResolvedValueOnce(
      new Response("<html>oops</html>", { status: 200, headers: { "content-type": "text/html" } })
    );
    expect((await rawRequest("/x", { parseMode: "contentType" })).data).toBeNull();
  });
});

describe("401 refresh-and-retry", () => {
  it("refreshes once then retries with the NEW token", async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({ detail: "expired" }, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    refreshAccessToken.mockImplementation(async () => {
      globalThis.__token = "tok-2";
    });

    const res = await rawRequest("/x");

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe("Bearer tok-2");
    expect(res.data).toEqual({ ok: true });
  });

  it("retries only once — a second 401 is returned as-is", async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({}, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({}, { status: 401 }));
    refreshAccessToken.mockResolvedValue(undefined);

    const res = await rawRequest("/x");

    expect(refreshAccessToken).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(res.status).toBe(401);
  });

  it("does not refresh for auth-exempt URLs (login)", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}, { status: 401 }));
    await rawRequest("/api_login/", { method: "POST", body: {} });
    expect(refreshAccessToken).not.toHaveBeenCalled();
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("never mutates the caller's options object across a retry", async () => {
    fetch
      .mockResolvedValueOnce(jsonResponse({}, { status: 401 }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));
    refreshAccessToken.mockResolvedValue(undefined);

    const opts = { method: "POST", body: { a: 1 } };
    const snapshot = JSON.stringify(opts);
    await rawRequest("/x", opts);

    expect(JSON.stringify(opts)).toBe(snapshot);
    expect(Object.keys(opts)).toEqual(["method", "body"]);
  });

  it("propagates a refresh failure to the caller", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}, { status: 401 }));
    refreshAccessToken.mockRejectedValue(new Error("refresh failed"));
    await expect(rawRequest("/x")).rejects.toThrow("refresh failed");
  });
});

describe("http.* throwing wrapper", () => {
  it("resolves with the body on success", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ id: 7 }));
    await expect(http.get("/x")).resolves.toEqual({ id: 7 });
  });

  it("throws HttpError carrying status and body", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ error: "bad input" }, { status: 422 }));
    await expect(http.post("/x", {})).rejects.toMatchObject({
      name: "HttpError",
      status: 422,
      body: { error: "bad input" },
      message: "bad input",
    });
  });

  it("falls back through msg/detail/message for the error text", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({ detail: "forbidden" }, { status: 403 }));
    await expect(request("/x")).rejects.toThrow("forbidden");
  });

  it("uses the HTTP status when the body carries no message", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}, { status: 500 }));
    await expect(request("/x")).rejects.toThrow("HTTP 500");
  });

  it("exposes HttpError for instanceof checks", async () => {
    fetch.mockResolvedValueOnce(jsonResponse({}, { status: 500 }));
    await expect(request("/x")).rejects.toBeInstanceOf(HttpError);
  });
});
