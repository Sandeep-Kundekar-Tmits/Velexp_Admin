import React, { useEffect, useMemo, useState } from "react";
import { Button, Card, CardBody, Input } from "@/components/ui";
import { RiDeleteBinLine } from "react-icons/ri";
import Loader from "@/Loaders/Loader";
import DeleteModal from "../../components/Common/DeleteModal";
import MenuPrivilegeTree from "../../components/AdminPrivileges/MenuPrivilegeTree";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { normalizeForEditing, buildPrivilegePayload } from "../../utils/privilegeTree";
import {
    ADMIN_ROLES_API,
    ADMIN_ROLE_PRIVILEGES_API,
    ADMIN_ROLE_PRIVILEGES_BY_ROLE_API,
    ADMIN_ROLE_PRIVILEGES_SAVE_API,
    ADMIN_ROLE_PRIVILEGES_DELETE_ALL_API,
} from "../../api";

const RolePrivilegesTab = () => {
    const { apifunc: fetchOverview, data: overviewData, loading: overviewLoading } = useGetApiCall();
    const { apifunc: fetchRoles, data: rolesData } = useGetApiCall();
    const { apifunc: fetchByRole, data: byRoleData, loading: treeLoading } = useGetApiCall();

    const [editingRoleId, setEditingRoleId] = useState(null);
    const [tree, setTree] = useState([]);
    const [clearTarget, setClearTarget] = useState(null);

    const loadOverview = () => fetchOverview(ADMIN_ROLE_PRIVILEGES_API);

    useEffect(() => {
        loadOverview();
        fetchRoles(`${ADMIN_ROLES_API}?is_active=true`);
    }, []);

    useEffect(() => {
        if (editingRoleId) fetchByRole(`${ADMIN_ROLE_PRIVILEGES_BY_ROLE_API}?role_id=${editingRoleId}`);
    }, [editingRoleId]);

    useEffect(() => {
        if (byRoleData) {
            const menus = byRoleData.menus || byRoleData.results || byRoleData || [];
            setTree(menus.map((m) => normalizeForEditing(m, "role")));
        }
    }, [byRoleData]);

    const closeEditorAndReload = () => { setEditingRoleId(null); loadOverview(); };
    const { apifunc: saveRolePrivileges, loading: saving } = usePostApiCall(closeEditorAndReload, "Role privileges saved successfully");
    const { apifunc: clearRolePrivileges, loading: clearing } = usePostApiCall(
        () => { setClearTarget(null); loadOverview(); },
        "Privileges cleared for this role"
    );

    const roles = useMemo(() => (Array.isArray(rolesData) ? rolesData : rolesData?.results || []), [rolesData]);
    const overview = useMemo(() => (Array.isArray(overviewData) ? overviewData : overviewData?.results || []), [overviewData]);

    const handleSave = () => {
        saveRolePrivileges(ADMIN_ROLE_PRIVILEGES_SAVE_API, { role_id: editingRoleId, menus: buildPrivilegePayload(tree) });
    };

    const handleClearAll = () => {
        clearRolePrivileges(ADMIN_ROLE_PRIVILEGES_DELETE_ALL_API, { role_id: clearTarget.role_id });
    };

    if (editingRoleId) {
        return (
            <div className="page-fit-body">
                <div className="flex justify-between items-center mb-3">
                    <Input
                        type="select"
                        style={{ width: "auto" }}
                        value={editingRoleId}
                        onChange={(e) => setEditingRoleId(e.target.value)}
                    >
                        {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </Input>
                    <div className="flex gap-2">
                        <Button color="secondary" onClick={() => setEditingRoleId(null)}>Back to Overview</Button>
                        <Button color="primary" onClick={handleSave} disabled={saving}>Save</Button>
                    </div>
                </div>

                {treeLoading ? (
                    <Loader fullscreen={false} />
                ) : (
                    <Card className="shadow-sm border-0">
                        <CardBody className="overflow-y-auto scroll-slim" style={{ maxHeight: "65vh" }}>
                            <MenuPrivilegeTree nodes={tree} mode="role" onChange={setTree} />
                        </CardBody>
                    </Card>
                )}
            </div>
        );
    }

    return (
        <div className="page-fit-body">
            <div className="flex justify-end mb-3">
                <Input
                    type="select"
                    style={{ width: "auto" }}
                    value=""
                    onChange={(e) => e.target.value && setEditingRoleId(e.target.value)}
                >
                    <option value="">Assign privileges to a role...</option>
                    {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Input>
            </div>

            {overviewLoading ? (
                <Loader fullscreen={false} />
            ) : overview.length ? (
                <div className="overflow-y-auto scroll-slim" style={{ maxHeight: "65vh" }}>
                    {overview.map((role) => (
                        <Card key={role.role_id} className="mb-2 shadow-sm">
                            <CardBody className="flex relative">
                                <h6 className="mb-0" style={{ fontSize: "16px", minWidth: 140 }}>{role.role_name}</h6>
                                <div style={{ marginLeft: 30, width: "100%" }}>
                                    <div className="absolute flex gap-2" style={{ top: 10, right: 10 }}>
                                        <Button size="sm" color="primary" outline onClick={() => setEditingRoleId(role.role_id)}>Edit</Button>
                                        <Button size="sm" color="danger" outline onClick={() => setClearTarget(role)}>
                                            <RiDeleteBinLine />
                                        </Button>
                                    </div>
                                    {(role.menus || []).map((menu) => (
                                        <div key={menu.menu_id} className="mb-2">
                                            <h6 className="text-ink" style={{ fontWeight: "normal" }}>{menu.link_name || menu.menu_name}</h6>
                                            <div className="flex flex-wrap gap-2">
                                                {(menu.children || []).length ? menu.children.map((child) => (
                                                    <span key={child.menu_id} className="badge rounded-full text-success-500 bg-success-500/10 border border-success-500/25 px-4 py-2">
                                                        {child.link_name || child.menu_name}
                                                    </span>
                                                )) : (
                                                    <span className="badge rounded-full text-ink-muted border px-4 py-2">No sub-menus</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardBody>
                        </Card>
                    ))}
                </div>
            ) : (
                <p className="text-ink-muted">No role privileges assigned yet.</p>
            )}

            {clearTarget && (
                <DeleteModal
                    show={true}
                    onCloseClick={() => setClearTarget(null)}
                    onDeleteClick={handleClearAll}
                    loading={clearing}
                />
            )}
        </div>
    );
};

export default RolePrivilegesTab;
