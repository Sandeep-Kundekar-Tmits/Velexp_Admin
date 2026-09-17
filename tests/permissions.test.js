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

describe("resolvePermissions — superuser", () => {
  const superUser = { is_admin: false, is_superuser: true };

  it("grants every url regardless of the tree, including Privileges screens", () => {
    const p = resolvePermissions(superUser, []);
    expect(p.canAccess("/anything")).toBe(true);
    expect(p.canAccess("/privileges")).toBe(true);
    expect(p.canAccess("/admin-privileges")).toBe(true);
    expect(p.canAccessAny(["/nope"])).toBe(true);
  });

  it("always lands on /user-list", () => {
    expect(resolvePermissions(superUser, []).defaultRoute).toBe("/user-list");
  });
});

describe("resolvePermissions — admin", () => {
  const admin = { is_admin: true, is_superuser: false };

  it("grants every url except the Privileges screens, regardless of the tree", () => {
    const p = resolvePermissions(admin, []);
    expect(p.canAccess("/anything")).toBe(true);
    expect(p.canAccess("/privileges")).toBe(false);
    expect(p.canAccess("/admin-privileges")).toBe(false);
  });

  it("canAccessAny is false when every url in the list is excluded", () => {
    const p = resolvePermissions(admin, []);
    expect(p.canAccessAny(["/privileges", "/admin-privileges"])).toBe(false);
    expect(p.canAccessAny(["/privileges", "/anything-else"])).toBe(true);
  });

  // Unlike is_superuser, is_admin does not hardcode the default route first
  // -- it's derived from the tree like a non-admin account, but with a
  // "/user-list" fallback (not /no_role) once the tree has nothing usable,
  // since an admin's canAccess bypass means they're never truly stranded.
  it("falls back to /user-list when the tree grants nothing usable", () => {
    expect(resolvePermissions(admin, []).defaultRoute).toBe("/user-list");
  });

  it("lands on whatever the tree actually grants", () => {
    const p = resolvePermissions(admin, [node("/cod-report", { can_view: true })]);
    expect(p.defaultRoute).toBe("/cod-report");
  });

  it("an explicit grant for a Privileges screen overrides the default exclusion", () => {
    const p = resolvePermissions(admin, [node("/admin-privileges", { can_view: true })]);
    expect(p.canAccess("/admin-privileges")).toBe(true);
    expect(p.canAccess("/privileges")).toBe(false);
  });

  it("still reports isAdmin:true for non-access-control consumers", () => {
    expect(resolvePermissions(admin, []).isAdmin).toBe(true);
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
