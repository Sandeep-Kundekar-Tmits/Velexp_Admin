import React, { useState } from "react";
import { IoMdAdd, IoMdRemove } from "react-icons/io";
import { MdClose } from "react-icons/md";
import { toggleNodeChecked } from "../../utils/privilegeTree";

const roleDefaultSummary = (roleDefault) => {
    const active = Object.entries(roleDefault || {})
        .filter(([key, value]) => value && key !== "has_fullacess")
        .map(([key]) => key.replace("can_", ""));
    return active.length ? active.join(", ") : "none";
};

// Recursive checkbox tree, shared by Role Privileges (mode="role") and
// User Overrides (mode="user") editors. Checking a menu grants full access.
// restrictedIds (typically the Privileges group, for a non-superuser editor)
// stays visible but locked read-only, at whatever checked state it actually
// has -- unlike lockedIds/mode="user" below, it must NOT force the checkbox
// to show checked, since a restricted node may genuinely not be granted.
const MenuPrivilegeTree = ({ nodes, mode = "role", onChange, onRemoveNode, lockedIds, restrictedIds }) => {
    const [collapsedIds, setCollapsedIds] = useState(() => new Set());

    const toggleCollapse = (id) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Checking (or unchecking) a group also stamps every menu nested under
    // it, and checking any menu also ensures every one of its ancestor
    // groups is at least viewable -- see toggleNodeChecked. Both lock
    // reasons are merged in so the cascade never touches a locked node.
    const handleCheck = (id, checked) => {
        const locked = new Set([
            ...(mode === "user" && lockedIds ? lockedIds : []),
            ...(restrictedIds || []),
        ]);
        onChange(toggleNodeChecked(nodes, id, checked, locked));
    };

    const renderNode = (node, depth) => {
        const hasChildren = node.children?.length > 0;
        const collapsed = collapsedIds.has(node.id);
        const roleLocked = mode === "user" && !!lockedIds?.has(node.id);
        const restricted = !!restrictedIds?.has(node.id);
        const locked = roleLocked || restricted;

        return (
            <div key={node.id} style={{ marginLeft: depth * 24 }} className="mb-2">
                <div className="flex items-center gap-2 p-2 rounded bg-canvas">
                    {hasChildren ? (
                        <span style={{ cursor: "pointer" }} onClick={() => toggleCollapse(node.id)}>
                            {collapsed ? <IoMdAdd /> : <IoMdRemove />}
                        </span>
                    ) : (
                        <span style={{ width: 16, display: "inline-block" }} />
                    )}

                    <input
                        className="form-check-input mt-0"
                        type="checkbox"
                        checked={roleLocked || node.checked}
                        disabled={locked}
                        title={
                            roleLocked ? "Granted by role -- can't be unchecked here"
                                : restricted ? "Only a superuser can grant Admin Privileges access"
                                    : undefined
                        }
                        onChange={(e) => handleCheck(node.id, e.target.checked)}
                    />

                    <span className="font-semibold">{node.link_name}</span>
                    {node.link_url && node.link_url !== "#" && (
                        <span className="text-ink-muted text-xs">{node.link_url}</span>
                    )}
                    {restricted && (
                        <span className="badge rounded-full text-ink-muted border px-2 py-0.5 text-xs">Superuser only</span>
                    )}

                    {mode === "user" && (
                        <span className="text-ink-muted text-xs ml-2">
                            Role default: {roleDefaultSummary(node.roleDefault)}
                        </span>
                    )}

                    {onRemoveNode && node.checked && (
                        <button
                            type="button"
                            className="btn btn-sm btn-outline-danger ml-auto"
                            title="Remove"
                            onClick={() => onRemoveNode(node.id)}
                        >
                            <MdClose />
                        </button>
                    )}
                </div>

                {hasChildren && !collapsed && (
                    <div>{node.children.map((child) => renderNode(child, depth + 1))}</div>
                )}
            </div>
        );
    };

    if (!nodes?.length) {
        return <p className="text-ink-muted">No menus available.</p>;
    }

    return <div>{nodes.map((node) => renderNode(node, 0))}</div>;
};

export default MenuPrivilegeTree;
