import { describe, expect, it } from "vitest";
import {
  applyFlagChange,
  buildPrivilegePayload,
  normalizeForEditing,
  updateNodeById,
} from "@/utils/privilegeTree";

const flags = (o = {}) => ({
  has_fullacess: false,
  can_view: false,
  can_save: false,
  can_update: false,
  can_delete: false,
  ...o,
});

describe("applyFlagChange", () => {
  it("checking has_fullacess sets all five flags", () => {
    expect(applyFlagChange(flags(), "has_fullacess", true)).toEqual(
      flags({
        has_fullacess: true,
        can_view: true,
        can_save: true,
        can_update: true,
        can_delete: true,
      })
    );
  });

  it("unchecking has_fullacess clears all five", () => {
    const all = flags({
      has_fullacess: true,
      can_view: true,
      can_save: true,
      can_update: true,
      can_delete: true,
    });
    expect(applyFlagChange(all, "has_fullacess", false)).toEqual(flags());
  });

  it("has_fullacess becomes true only once all four granular flags are set", () => {
    let f = flags();
    for (const k of ["can_view", "can_save", "can_update"]) {
      f = applyFlagChange(f, k, true);
      expect(f.has_fullacess).toBe(false);
    }
    f = applyFlagChange(f, "can_delete", true);
    expect(f.has_fullacess).toBe(true);
  });

  it("clearing one granular flag re-derives has_fullacess to false", () => {
    const all = flags({
      has_fullacess: true,
      can_view: true,
      can_save: true,
      can_update: true,
      can_delete: true,
    });
    expect(applyFlagChange(all, "can_save", false).has_fullacess).toBe(false);
  });
});

describe("normalizeForEditing", () => {
  it("maps the role-privileges shape and recurses into children", () => {
    const node = normalizeForEditing(
      {
        menu_id: 1,
        link_name: "Reports",
        link_url: "#",
        is_assigned: true,
        can_view: true,
        children: [{ menu_id: 2, link_name: "COD Report", link_url: "/cod-report" }],
      },
      "role"
    );
    expect(node.id).toBe(1);
    expect(node.checked).toBe(true);
    expect(node.flags.can_view).toBe(true);
    expect(node.children[0]).toMatchObject({ id: 2, link_url: "/cod-report", checked: false });
  });

  it("accepts the menus/tree field names (menu_name / menu_url)", () => {
    const node = normalizeForEditing({ menu_id: 9, menu_name: "Invoices", menu_url: "/inv" });
    expect(node.link_name).toBe("Invoices");
    expect(node.link_url).toBe("/inv");
  });

  it("user mode prefers effective flags over override and role default", () => {
    const node = normalizeForEditing(
      {
        menu_id: 3,
        role_default: { can_view: true },
        override: { can_view: false, can_save: true },
        effective: { can_view: true, can_save: true },
      },
      "user"
    );
    expect(node.flags).toEqual(flags({ can_view: true, can_save: true }));
    expect(node.roleDefault).toEqual(flags({ can_view: true }));
    expect(node.checked).toBe(true);
  });

  it("user mode falls back to the role default when nothing is overridden", () => {
    const node = normalizeForEditing({ menu_id: 4, role_default: { can_view: true } }, "user");
    expect(node.flags.can_view).toBe(true);
  });
});

describe("updateNodeById", () => {
  const tree = [
    { id: 1, children: [{ id: 2, children: [{ id: 3, children: [] }] }] },
    { id: 4, children: [] },
  ];

  it("updates a deeply nested node", () => {
    const next = updateNodeById(tree, 3, (n) => ({ ...n, checked: true }));
    expect(next[0].children[0].children[0].checked).toBe(true);
  });

  it("does not mutate the original tree", () => {
    updateNodeById(tree, 3, (n) => ({ ...n, checked: true }));
    expect(tree[0].children[0].children[0].checked).toBeUndefined();
  });

  it("leaves untouched branches referentially equal", () => {
    const next = updateNodeById(tree, 3, (n) => ({ ...n, checked: true }));
    expect(next[1]).toBe(tree[1]);
  });
});

describe("buildPrivilegePayload", () => {
  it("role mode includes checked nodes only", () => {
    const payload = buildPrivilegePayload([
      { id: 1, checked: true, flags: flags({ can_view: true }), children: [] },
      { id: 2, checked: false, flags: flags(), children: [] },
    ]);
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({ menu_id: 1, can_view: true });
  });

  it("keeps an unchecked parent when a descendant is included, so nesting stays valid", () => {
    const payload = buildPrivilegePayload([
      {
        id: 1,
        checked: false,
        flags: flags(),
        children: [{ id: 2, checked: true, flags: flags({ can_view: true }), children: [] }],
      },
    ]);
    expect(payload).toHaveLength(1);
    expect(payload[0].menu_id).toBe(1);
    expect(payload[0].children[0].menu_id).toBe(2);
  });

  it("user mode omits nodes that merely match the role default", () => {
    const payload = buildPrivilegePayload([
      {
        id: 1,
        roleDefault: flags({ can_view: true }),
        flags: flags({ can_view: true }),
        children: [],
      },
    ]);
    expect(payload).toEqual([]);
  });

  it("user mode includes a node whose flags diverge from the role default", () => {
    const payload = buildPrivilegePayload([
      {
        id: 1,
        roleDefault: flags({ can_view: true }),
        flags: flags({ can_view: true, can_save: true }),
        children: [],
      },
    ]);
    expect(payload).toHaveLength(1);
    expect(payload[0]).toMatchObject({ menu_id: 1, can_view: true, can_save: true });
  });

  it("user mode includes a revoked node (role grants, user does not)", () => {
    const payload = buildPrivilegePayload([
      { id: 1, roleDefault: flags({ can_view: true }), flags: flags(), children: [] },
    ]);
    expect(payload).toHaveLength(1);
    expect(payload[0].can_view).toBe(false);
  });
});
