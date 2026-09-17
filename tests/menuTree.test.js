import { describe, expect, it } from "vitest";
import { MENU } from "@/features/navigation/menuTree";
import { resolvePermissions } from "@/features/auth/permissions";

/** Mirrors SidebarNav's filter so the rules can be asserted directly. */
function filterMenu(nodes, canAccess) {
  const out = [];
  for (const node of nodes) {
    if (node.hidden) continue;
    if (node.children) {
      const children = filterMenu(node.children, canAccess);
      if (children.length) out.push({ ...node, children });
    } else if (canAccess(node.url)) {
      out.push(node);
    }
  }
  return out;
}

const leaves = (nodes) =>
  nodes.flatMap((n) => (n.children ? leaves(n.children) : [n.url]));

const staff = (urls) =>
  resolvePermissions(
    { is_admin: false, is_staff: true },
    urls.map((u) => ({ link_url: u, can_view: true, children: [] }))
  );

// is_admin no longer bypasses privileges, so "every leaf granted" is just a
// fully-privileged account -- built from every leaf url in MENU itself
// (including the two hidden/kill-switched ones) so the hidden-flag tests
// below prove suppression comes from `hidden`, not from a missing grant.
const fullAccess = staff(leaves(MENU));

describe("menu tree data", () => {
  it("every leaf has a url and a label", () => {
    const walk = (nodes) =>
      nodes.forEach((n) => {
        expect(n.label, JSON.stringify(n)).toBeTruthy();
        if (n.children) walk(n.children);
        else expect(n.url, `${n.label} has no url`).toMatch(/^\//);
      });
    walk(MENU);
  });

  it("no group is empty", () => {
    const walk = (nodes) =>
      nodes.forEach((n) => {
        if (n.children) {
          expect(n.children.length, `${n.label} is an empty group`).toBeGreaterThan(0);
          walk(n.children);
        }
      });
    walk(MENU);
  });

  it("keeps the two kill-switched entries hidden", () => {
    // showCodReconciliation / showPopReconciliation were hardcoded false.
    // Uses fullAccess (every leaf granted, is_admin irrelevant) to prove
    // suppression comes from `hidden`, not from a missing privilege.
    const visible = leaves(filterMenu(MENU, fullAccess.canAccess));
    expect(visible).not.toContain("/cod-reconciliation");
    expect(visible).not.toContain("/pop-reconcilation");
  });
});

describe("filterMenu", () => {
  it("shows a fully-privileged account every non-hidden leaf", () => {
    const visible = leaves(filterMenu(MENU, fullAccess.canAccess));
    const allLeaves = new Set(leaves(MENU));
    allLeaves.delete("/cod-reconciliation");
    allLeaves.delete("/pop-reconcilation");
    expect(new Set(visible)).toEqual(allLeaves);
  });

  it("shows staff only what their privileges grant", () => {
    const perms = staff(["/add-pod", "/cod-report", "/tracking"]);
    const visible = leaves(filterMenu(MENU, perms.canAccess));
    expect(new Set(visible)).toEqual(new Set(["/add-pod", "/cod-report", "/tracking"]));
  });

  it("drops groups whose children are all inaccessible", () => {
    const perms = staff(["/add-pod"]);
    const filtered = filterMenu(MENU, perms.canAccess);
    // "Reports", "Customers" etc. must not survive as empty expanders.
    expect(filtered.every((n) => !n.children || n.children.length > 0)).toBe(true);
    expect(filtered.map((n) => n.label)).toEqual(["Add POD"]);
  });

  it("keeps a group when only one deep descendant is granted", () => {
    const perms = staff(["/last-mile-operation"]);
    const filtered = filterMenu(MENU, perms.canAccess);
    expect(leaves(filtered)).toEqual(["/last-mile-operation"]);
    // Reports > Operation Performance > leaf — nesting preserved.
    expect(filtered[0].label).toBe("Reports");
    expect(filtered[0].children[0].label).toBe("Operation Performance");
  });

  it("returns nothing for a user with no privileges", () => {
    expect(filterMenu(MENU, staff([]).canAccess)).toEqual([]);
  });
});
