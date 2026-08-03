import React, { useState } from "react";
import { IoMdAdd, IoMdRemove } from "react-icons/io";
import { MdClose } from "react-icons/md";
import { applyFlagChange, updateNodeById } from "../../utils/privilegeTree";

const roleDefaultSummary = (roleDefault) => {
    const active = Object.entries(roleDefault || {})
        .filter(([key, value]) => value && key !== "has_fullacess")
        .map(([key]) => key.replace("can_", ""));
    return active.length ? active.join(", ") : "none";
};

// Recursive checkbox tree, shared by Role Privileges (mode="role") and
// User Overrides (mode="user") editors. Checking a menu grants full access.
const MenuPrivilegeTree = ({ nodes, mode = "role", onChange, onRemoveNode, lockedIds }) => {
    const [collapsedIds, setCollapsedIds] = useState(() => new Set());

    const toggleCollapse = (id) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const handleCheck = (id, checked) => {
        onChange(updateNodeById(nodes, id, (node) => ({
            ...node,
            checked,
            flags: applyFlagChange(node.flags, "has_fullacess", checked),
        })));
    };

    const renderNode = (node, depth) => {
        const hasChildren = node.children?.length > 0;
        const collapsed = collapsedIds.has(node.id);
        const locked = mode === "user" && !!lockedIds?.has(node.id);

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
                        checked={locked || node.checked}
                        disabled={locked}
                        title={locked ? "Granted by role -- can't be unchecked here" : undefined}
                        onChange={(e) => handleCheck(node.id, e.target.checked)}
                    />

                    <span className="font-semibold">{node.link_name}</span>
                    {node.link_url && node.link_url !== "#" && (
                        <span className="text-ink-muted text-xs">{node.link_url}</span>
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
