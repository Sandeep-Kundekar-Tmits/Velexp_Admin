// Shared helpers for the Role Privileges and User Overrides checkbox-tree
// editors in Admin Privileges. Both trees hold the same 5 permission flags
// per menu node, so the flag-toggle/payload-building logic is written once
// here instead of duplicated per screen.

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
