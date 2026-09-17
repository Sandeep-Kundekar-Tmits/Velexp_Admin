// Shared helpers for the Role Privileges and User Overrides checkbox-tree
// editors in Admin Privileges. Both trees hold the same 5 permission flags
// per menu node, so the flag-toggle/payload-building logic is written once
// here instead of duplicated per screen.

// Non-superuser admins can reach Role Privileges / User Overrides (granted
// via the privileges tree like any other screen), but must not be able to
// grant the Privileges group itself to a role or user -- doing so would let
// them create a backdoor to Admin Privileges for anyone. That used to mean
// filtering the node out of the tree entirely for them; it's now kept
// visible (so what exists isn't hidden) but locked read-only -- see
// collectPrivilegesGroupIds, whose result MenuPrivilegeTree disables.
export function collectPrivilegesGroupIds(nodes, acc = new Set()) {
    const collectAll = (node) => {
        acc.add(node.id);
        (node.children || []).forEach(collectAll);
    };
    (nodes || []).forEach((node) => {
        if (node.link_name === "Privileges") collectAll(node);
        else if (node.children?.length) collectPrivilegesGroupIds(node.children, acc);
    });
    return acc;
}

const PERMISSION_KEYS = ["has_fullacess", "can_view", "can_save", "can_update", "can_delete"];
const GRANULAR_KEYS = ["can_view", "can_save", "can_update", "can_delete"];

const emptyFlags = () => ({
    has_fullacess: false,
    can_view: false,
    can_save: false,
    can_update: false,
    can_delete: false,
});

// Toggling has_fullacess sets/clears all 5 flags together; toggling any
// granular flag re-derives has_fullacess from whether all 4 are now true.
export function applyFlagChange(flags, key, checked) {
    const next = { ...flags, [key]: checked };
    if (key === "has_fullacess") {
        PERMISSION_KEYS.forEach((k) => { next[k] = checked; });
    } else {
        next.has_fullacess = GRANULAR_KEYS.every((k) => next[k]);
    }
    return next;
}

// Normalizes one raw API menu node (role-privileges/by-role or
// user-overrides/by-user shape) into the internal editing shape the tree
// component works with: { id, link_name, link_url, faicon, checked, flags, children, roleDefault? }
export function normalizeForEditing(raw, mode = "role") {
    const id = raw.menu_id ?? raw.id;
    const link_name = raw.link_name ?? raw.menu_name ?? "";
    const link_url = raw.link_url ?? raw.menu_url ?? "";
    const children = (raw.children || []).map((child) => normalizeForEditing(child, mode));

    if (mode === "user") {
        const roleDefault = { ...emptyFlags(), ...(raw.role_default || {}) };
        // Reflect what the user can actually do right now (role default,
        // overridden or not) -- not just whether an override row exists.
        const flags = { ...emptyFlags(), ...(raw.effective || raw.override || roleDefault) };
        const checked = PERMISSION_KEYS.some((k) => flags[k]);
        return { id, link_name, link_url, faicon: raw.faicon, roleDefault, checked, flags, children };
    }

    return {
        id,
        link_name,
        link_url,
        faicon: raw.faicon,
        checked: !!raw.is_assigned,
        flags: {
            has_fullacess: !!raw.has_fullacess,
            can_view: !!raw.can_view,
            can_save: !!raw.can_save,
            can_update: !!raw.can_update,
            can_delete: !!raw.can_delete,
        },
        children,
    };
}

// Immutably updates the node with the given id anywhere in the tree.
export function updateNodeById(nodes, id, updater) {
    return nodes.map((node) => {
        if (node.id === id) return updater(node);
        if (node.children?.length) return { ...node, children: updateNodeById(node.children, id, updater) };
        return node;
    });
}

// Checking (or unchecking) a group applies the same state to every menu
// underneath it, the way a real-world "grant this whole section" click is
// expected to behave -- without this a parent's own checkbox meant nothing
// beyond itself, and every sub-menu still had to be ticked one at a time.
// A locked node (mode="user", granted by role) is left alone, same as
// clicking it directly would be.
function setCheckedRecursive(node, checked, lockedIds) {
    const locked = !!lockedIds?.has(node.id);
    return {
        ...node,
        checked: locked ? node.checked : checked,
        flags: locked ? node.flags : applyFlagChange(node.flags, "has_fullacess", checked),
        children: (node.children || []).map((child) => setCheckedRecursive(child, checked, lockedIds)),
    };
}

// A checked sub-menu is unreachable if its parent group grants nothing, so
// checking one also marks every ancestor at least viewable (can_view) --
// not full access, since asking for the leaf doesn't imply the group
// itself should be save/update/delete-able too.
function ensureViewable(node) {
    if (node.checked) return node;
    return { ...node, checked: true, flags: applyFlagChange(node.flags, "can_view", true) };
}

// The single entry point MenuPrivilegeTree calls on every checkbox click.
// Combines both cascade directions:
//  - down: checking/unchecking a group stamps every descendant (setCheckedRecursive)
//  - up: checking a leaf/group also ensures every ancestor is at least
//    viewable, so a granted screen is always reachable through the menu
// The up-cascade only runs when checking, not unchecking -- a sibling under
// the same parent may still be granted, so clearing one leaf must not touch
// its ancestors (which would, via their own down-cascade, wipe that sibling too).
function walkAndToggle(node, id, checked, lockedIds) {
    if (node.id === id) {
        return { node: setCheckedRecursive(node, checked, lockedIds), matched: true };
    }
    if (!node.children?.length) {
        return { node, matched: false };
    }
    let matchedInChildren = false;
    const children = node.children.map((child) => {
        const result = walkAndToggle(child, id, checked, lockedIds);
        if (result.matched) matchedInChildren = true;
        return result.node;
    });
    let updated = { ...node, children };
    if (matchedInChildren && checked && !lockedIds?.has(node.id)) {
        updated = ensureViewable(updated);
    }
    return { node: updated, matched: matchedInChildren };
}

export function toggleNodeChecked(nodes, id, checked, lockedIds) {
    return nodes.map((node) => walkAndToggle(node, id, checked, lockedIds).node);
}

// Builds the nested {menu_id, ...flags, children} payload the save/
// endpoints expect. Role mode has no roleDefault to compare against, so a
// node is included whenever it's checked (directly assigned). User mode
// only carries an actual override row when its flags diverge from the
// role default -- a node just mirroring the role default means "no
// override, keep inheriting from the role", so it's left out rather than
// being written as a redundant per-user override. Either way, a node with
// an included descendant is kept too, so nesting stays valid regardless of
// depth -- the backend auto-corrects an included-but-unchecked parent to
// can_view=true.
export function buildPrivilegePayload(nodes) {
    const walk = (list) => (list || []).reduce((acc, node) => {
        const children = walk(node.children);
        const flags = node.flags || emptyFlags();
        const isOverride = node.roleDefault
            ? PERMISSION_KEYS.some((k) => !!flags[k] !== !!node.roleDefault[k])
            : node.checked;
        if (isOverride || children.length) {
            acc.push({
                menu_id: node.id,
                has_fullacess: !!flags.has_fullacess,
                can_view: !!flags.can_view,
                can_save: !!flags.can_save,
                can_update: !!flags.can_update,
                can_delete: !!flags.can_delete,
                children,
            });
        }
        return acc;
    }, []);
    return walk(nodes);
}
