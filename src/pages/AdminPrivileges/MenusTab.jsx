import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { RiDeleteBinLine, RiEditLine, RiAddLine, RiArrowUpLine, RiArrowDownLine } from "react-icons/ri";
import { IoMdAdd, IoMdRemove } from "react-icons/io";
import { GridLoader } from "react-spinners";
import DeleteModal from "../../components/Common/DeleteModal";
import MenuFormModal from "../../components/AdminPrivileges/MenuFormModal";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { usePutApiCall } from "../../hooks/usePutApuCall";
import { useDeleteApiCall } from "../../hooks/useDeleteApiCall";
import ToasterProvider from "../../helpers/ToasterProvider";
import { ADMIN_MENUS_API, ADMIN_MENUS_TREE_API, ADMIN_MENUS_REORDER_API } from "../../api";

const flattenMenus = (nodes, acc = []) => {
    (nodes || []).forEach((node) => {
        acc.push(node);
        flattenMenus(node.children, acc);
    });
    return acc;
};

const MenusTab = () => {
    const { apifunc: fetchTree, data, loading } = useGetApiCall();
    const { apifunc: reorderMenus } = usePostApiCall();
    const { ErrorToaster, SucceesToaster } = ToasterProvider();

    const [collapsedIds, setCollapsedIds] = useState(() => new Set());
    const [formOpen, setFormOpen] = useState(false);
    const [selectedMenu, setSelectedMenu] = useState(null);
    const [defaultParent, setDefaultParent] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = () => fetchTree(ADMIN_MENUS_TREE_API);
    useEffect(() => { load(); }, []);

    const closeAndReload = () => { setFormOpen(false); load(); };
    const { apifunc: createMenu, loading: creating } = usePostApiCall(closeAndReload, "Menu created successfully");
    const { apifunc: updateMenu, loading: updating } = usePutApiCall("Menu updated successfully", closeAndReload);
    const { apifunc: deleteMenu, loading: deleting, error: deleteError } = useDeleteApiCall();

    useEffect(() => { if (deleteError) ErrorToaster(deleteError); }, [deleteError]);

    const tree = useMemo(() => (Array.isArray(data) ? data : data?.results || data?.menus || []), [data]);
    const flatMenus = useMemo(() => flattenMenus(tree), [tree]);

    const handleSubmit = (formData, id) => {
        if (id) updateMenu(`${ADMIN_MENUS_API}${id}/`, formData);
        else createMenu(ADMIN_MENUS_API, formData);
    };

    const handleDelete = async () => {
        const result = await deleteMenu(`${ADMIN_MENUS_API}${deleteTarget.menu_id}/`);
        if (result) {
            SucceesToaster("Menu deleted successfully");
            setDeleteTarget(null);
            load();
        }
    };

    const handleMove = async (siblings, index, direction) => {
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= siblings.length) return;
        const a = siblings[index];
        const b = siblings[targetIndex];
        await reorderMenus(ADMIN_MENUS_REORDER_API, {
            items: [
                { menu_id: a.menu_id, exc_ord: b.exc_ord },
                { menu_id: b.menu_id, exc_ord: a.exc_ord },
            ],
        });
        load();
    };

    const toggleCollapse = (id) => {
        setCollapsedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const renderNode = (node, depth, siblings, index) => {
        const hasChildren = node.children?.length > 0;
        const collapsed = collapsedIds.has(node.menu_id);

        return (
            <div key={node.menu_id} style={{ marginLeft: depth * 24 }} className="mb-2">
                <div className="d-flex align-items-center gap-2 p-2 rounded bg-light border">
                    {hasChildren ? (
                        <span style={{ cursor: "pointer" }} onClick={() => toggleCollapse(node.menu_id)}>
                            {collapsed ? <IoMdAdd /> : <IoMdRemove />}
                        </span>
                    ) : (
                        <span style={{ width: 16, display: "inline-block" }} />
                    )}

                    {node.faicon && <i className={node.faicon} />}
                    <span className="fw-semibold">{node.menu_name}</span>
                    <span className="text-muted small">{node.menu_url}</span>
                    {node.is_active === false && <span className="badge bg-secondary">Inactive</span>}

                    <div className="d-flex gap-1 ms-auto">
                        <Button size="sm" color="light" outline disabled={index === 0} onClick={() => handleMove(siblings, index, -1)} title="Move up">
                            <RiArrowUpLine />
                        </Button>
                        <Button size="sm" color="light" outline disabled={index === siblings.length - 1} onClick={() => handleMove(siblings, index, 1)} title="Move down">
                            <RiArrowDownLine />
                        </Button>
                        <Button size="sm" color="success" outline onClick={() => { setSelectedMenu(null); setDefaultParent(node.menu_id); setFormOpen(true); }} title="Add child menu">
                            <RiAddLine />
                        </Button>
                        <Button size="sm" color="primary" outline onClick={() => { setSelectedMenu(node); setDefaultParent(null); setFormOpen(true); }} title="Edit">
                            <RiEditLine />
                        </Button>
                        <Button size="sm" color="danger" outline onClick={() => setDeleteTarget(node)} title="Delete">
                            <RiDeleteBinLine />
                        </Button>
                    </div>
                </div>

                {hasChildren && !collapsed && (
                    <div>{node.children.map((child, i) => renderNode(child, depth + 1, node.children, i))}</div>
                )}
            </div>
        );
    };

    return (
        <div>
            <div className="d-flex justify-content-end mb-3">
                <Button color="primary" onClick={() => { setSelectedMenu(null); setDefaultParent(null); setFormOpen(true); }}>+ New Menu</Button>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center mt-5"><GridLoader color="#556ee6" /></div>
            ) : tree.length ? (
                <div>{tree.map((node, i) => renderNode(node, 0, tree, i))}</div>
            ) : (
                <p className="text-muted">No menus yet.</p>
            )}

            <MenuFormModal
                isOpen={formOpen}
                toggle={() => setFormOpen(false)}
                initialData={selectedMenu}
                parentOptions={flatMenus}
                defaultParent={defaultParent}
                onSubmit={handleSubmit}
                loading={creating || updating}
            />

            {deleteTarget && (
                <DeleteModal
                    show={true}
                    onCloseClick={() => setDeleteTarget(null)}
                    onDeleteClick={handleDelete}
                    loading={deleting}
                />
            )}
        </div>
    );
};

export default MenusTab;
