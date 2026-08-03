// @vitest-environment jsdom
//
// Needs a DOM for localStorage; the suite default is "node" so that the pure
// logic tests stay fast.

/**
 * These tests exist to protect the interop contract: the persisted shape of
 * localStorage["authUser"] must stay byte-compatible with what the login
 * endpoint returns, because tokenRefresh, checkMenuAccess, ProfileMenu and the
 * legacy app all read that key directly.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ BASE_URL: "https://api.test", SECRET_KEY: "x" }));

const LOGIN_RESPONSE = {
  status: "success",
  access: "access-token",
  refresh: "refresh-token",
  user: { id: 1, username: "ops1", is_admin: false, is_staff: true },
  privileges: [{ menu_id: 1, link_url: "/cod-report", can_view: true, children: [] }],
};

let store;
beforeEach(async () => {
  localStorage.clear();
  vi.resetModules();
  ({ useAuthStore: store } = await import("@/stores/authStore"));
});

describe("authStore persistence", () => {
  it("writes the login response verbatim, with no zustand envelope", () => {
    store.getState().setSession(LOGIN_RESPONSE);

    const raw = JSON.parse(localStorage.getItem("authUser"));
    expect(raw).toEqual(LOGIN_RESPONSE);
    // The envelope zustand would add by default would break every direct reader.
    expect(raw.state).toBeUndefined();
    expect(raw.version).toBeUndefined();
  });

  it("keeps all five top-level keys the legacy consumers expect", () => {
    store.getState().setSession(LOGIN_RESPONSE);
    expect(Object.keys(JSON.parse(localStorage.getItem("authUser"))).sort()).toEqual(
      ["access", "privileges", "refresh", "status", "user"].sort()
    );
  });

  it("rehydrates an existing authUser written by the legacy app", async () => {
    localStorage.setItem("authUser", JSON.stringify(LOGIN_RESPONSE));
    vi.resetModules();
    const { useAuthStore } = await import("@/stores/authStore");
    expect(useAuthStore.getState().user?.username).toBe("ops1");
    expect(useAuthStore.getState().access).toBe("access-token");
  });

  it("clearSession removes the key entirely, not just its contents", () => {
    store.getState().setSession(LOGIN_RESPONSE);
    store.getState().clearSession();
    // Legacy code treats "key present" as "signed in", so an emptied object
    // would leave the app believing there is still a session.
    expect(localStorage.getItem("authUser")).toBeNull();
  });

  it("setPrivileges updates the tree without disturbing the tokens", () => {
    store.getState().setSession(LOGIN_RESPONSE);
    store.getState().setPrivileges([{ menu_id: 9, link_url: "/itrack", can_view: true }]);

    const raw = JSON.parse(localStorage.getItem("authUser"));
    expect(raw.access).toBe("access-token");
    expect(raw.refresh).toBe("refresh-token");
    expect(raw.privileges).toHaveLength(1);
    expect(raw.privileges[0].link_url).toBe("/itrack");
  });
});

describe("getAuthSnapshot", () => {
  it("reads through to localStorage before the store has hydrated", async () => {
    localStorage.setItem("authUser", JSON.stringify(LOGIN_RESPONSE));
    vi.resetModules();
    const { getAuthSnapshot } = await import("@/stores/authStore");
    expect(getAuthSnapshot().user?.username).toBe("ops1");
  });

  it("returns an empty session when nothing is stored", async () => {
    const { getAuthSnapshot } = await import("@/stores/authStore");
    expect(getAuthSnapshot().user).toBeNull();
    expect(getAuthSnapshot().privileges).toEqual([]);
  });

  it("survives a corrupt authUser entry", async () => {
    localStorage.setItem("authUser", "{not json");
    vi.resetModules();
    const { getAuthSnapshot } = await import("@/stores/authStore");
    expect(getAuthSnapshot().user).toBeNull();
  });
});
