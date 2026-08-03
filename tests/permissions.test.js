import { describe, expect, it } from "vitest";
import {
  flattenPrivilegeUrls,
  resolvePermissions,
  NO_ROLE_ROUTE,
} from "@/features/auth/permissions";

const node = (url, flags = {}, children = []) => ({
  link_url: url,
  has_fullacess: false,
  can_view: false,
  ...flags,
  children,
});

describe("flattenPrivilegeUrls", () => {
  it("includes a url when can_view is set", () => {
    expect([...flattenPrivilegeUrls([node("/a", { can_view: true })])]).toEqual(["/a"]);
  });

  it("includes a url when has_fullacess is set", () => {
    expect([...flattenPrivilegeUrls([node("/a", { has_fullacess: true })])]).toEqual(["/a"]);
  });

  it("excludes a node with neither flag", () => {
    expect([...flattenPrivilegeUrls([node("/a")])]).toEqual([]);
  });

  it('skips "#" grouping nodes but still walks their children', () => {
    const tree = [node("#", { can_view: true }, [node("/child", { can_view: true })])];
    expect([...flattenPrivilegeUrls(tree)]).toEqual(["/child"]);
  });

  it("recurses to arbitrary depth", () => {
    const tree = [
      node("#", {}, [node("#", {}, [node("/deep", { can_view: true })])]),
    ];
    expect([...flattenPrivilegeUrls(tree)]).toEqual(["/deep"]);
  });

  it("tolerates null/undefined input", () => {
    expect([...flattenPrivilegeUrls(null)]).toEqual([]);
    expect([...flattenPrivilegeUrls(undefined)]).toEqual([]);
  });
});

describe("resolvePermissions — admin", () => {
  const admin = { is_admin: true };

  it("grants every url regardless of the tree", () => {
    const p = resolvePermissions(admin, []);
    expect(p.canAccess("/anything")).toBe(true);
    expect(p.canAccessAny(["/nope"])).toBe(true);
  });

  it("always lands on /user-list", () => {
    expect(resolvePermissions(admin, []).defaultRoute).toBe("/user-list");
  });
});

describe("resolvePermissions — staff", () => {
  const staff = { is_admin: false, is_staff: true };

  it("grants only what the tree contains", () => {
    const p = resolvePermissions(staff, [node("/cod-report", { can_view: true })]);
    expect(p.canAccess("/cod-report")).toBe(true);
    expect(p.canAccess("/user-list")).toBe(false);
  });

  it("canAccessAny is true when any one url matches", () => {
    const p = resolvePermissions(staff, [node("/b", { can_view: true })]);
    expect(p.canAccessAny(["/a", "/b"])).toBe(true);
    expect(p.canAccessAny(["/a", "/c"])).toBe(false);
  });

  it("canAccessAny tolerates an empty or missing list", () => {
    const p = resolvePermissions(staff, [node("/b", { can_view: true })]);
    expect(p.canAccessAny([])).toBe(false);
    expect(p.canAccessAny(undefined)).toBe(false);
  });

  it("picks the highest-priority landing route the user actually has", () => {
    // /tracking outranks /itrack in LANDING_PRIORITY.
    const tree = [node("/itrack", { can_view: true }), node("/tracking", { can_view: true })];
    expect(resolvePermissions(staff, tree).defaultRoute).toBe("/tracking");
  });

  it("falls back to any accessible url when none are in the priority list", () => {
    const p = resolvePermissions(staff, [node("/obscure-screen", { can_view: true })]);
    expect(p.defaultRoute).toBe("/obscure-screen");
  });

  it("falls back to /no_role when nothing is accessible", () => {
    expect(resolvePermissions(staff, []).defaultRoute).toBe(NO_ROLE_ROUTE);
  });
});

describe("resolvePermissions — no session", () => {
  it("denies everything and lands on /no_role", () => {
    const p = resolvePermissions(null, null);
    expect(p.isAdmin).toBe(false);
    expect(p.canAccess("/user-list")).toBe(false);
    expect(p.defaultRoute).toBe(NO_ROLE_ROUTE);
  });
});
