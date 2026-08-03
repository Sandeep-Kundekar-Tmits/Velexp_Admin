import React, { useEffect, useMemo, useState } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from "@/components/ui";
import { GridLoader } from "react-spinners";
import MenuPrivilegeTree from "./MenuPrivilegeTree";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { normalizeForEditing, buildPrivilegePayload } from "../../utils/privilegeTree";
import {
    ADMIN_ROLES_API,
    ADMIN_ROLE_PRIVILEGES_BY_ROLE_API,
    ADMIN_USER_OVERRIDES_BY_USER_API,
    ADMIN_USER_OVERRIDES_SAVE_API,
    ADMIN_USER_OVERRIDES_DELETE_ALL_API,
    ADMIN_USER_ROLES_ASSIGN_API,
    ADMIN_USER_ROLES_REMOVE_API,
} from "../../api";

// Collects the menu_ids the given role directly grants (is_assigned:true),
// walking the nested tree the role-privileges/by-role endpoint returns.
const collectAssignedMenuIds = (menus, acc = new Set()) => {
    (menus || []).forEach((m) => {
        if (m.is_assigned) acc.add(m.menu_id ?? m.id);
        collectAssignedMenuIds(m.children, acc);
    });
    return acc;
};

const UserOverridesPanel = ({ user, onClose, onRoleChanged }) => {
    const { apifunc: fetchRoles, data: rolesData } = useGetApiCall();
    const { apifunc: fetchOverrides, data: overridesData, loading: overridesLoading } = useGetApiCall();
    const { apifunc: fetchRolePrivileges, data: rolePrivilegesData } = useGetApiCall();

    const [selectedRoleId, setSelectedRoleId] = useState(user.role_id || "");
    const [tree, setTree] = useState([]);

    const loadOverrides = () => fetchOverrides(`${ADMIN_USER_OVERRIDES_BY_USER_API}?user_id=${user.id}`);

    useEffect(() => {
        fetchRoles(`${ADMIN_ROLES_API}?is_active=true`);
        loadOverrides();
    }, []);

    useEffect(() => {
        if (overridesData) {
            const menus = overridesData.menus || overridesData.results || overridesData || [];
            setTree(menus.map((m) => normalizeForEditing(m, "user")));
        }
    }, [overridesData]);

    // Whenever the role changes -- the user's default one on open, or a
    // different one picked from the dropdown -- pull that role's assigned
    // menus so they can be locked (checked, can't be unchecked) below.
    useEffect(() => {
        if (selectedRoleId) fetchRolePrivileges(`${ADMIN_ROLE_PRIVILEGES_BY_ROLE_API}?role_id=${selectedRoleId}`);
    }, [selectedRoleId]);

    const lockedMenuIds = useMemo(() => {
        const menus = rolePrivilegesData?.menus || rolePrivilegesData?.results || rolePrivilegesData || [];
        return collectAssignedMenuIds(Array.isArray(menus) ? menus : []);
    }, [rolePrivilegesData]);

    const { apifunc: assignRole, loading: assigning } = usePostApiCall(onRoleChanged, "Role assigned successfully");
    const { apifunc: removeRole, loading: removingRole } = usePostApiCall(onRoleChanged, "Role removed successfully");
    const { apifunc: saveOverrides, loading: saving } = usePostApiCall(loadOverrides, "Overrides saved successfully");
    const { apifunc: clearOverrides, loading: clearing } = usePostApiCall(loadOverrides, "All overrides cleared");

    const roles = useMemo(() => (Array.isArray(rolesData) ? rolesData : rolesData?.results || []), [rolesData]);

    const handleAssignRole = () => {
        if (!selectedRoleId) return;
        assignRole(ADMIN_USER_ROLES_ASSIGN_API, { user_id: user.id, role_id: Number(selectedRoleId) });
    };

    const handleRemoveRole = () => {
        removeRole(ADMIN_USER_ROLES_REMOVE_API, { user_id: user.id });
    };

    const handleSaveOverrides = () => {
        saveOverrides(ADMIN_USER_OVERRIDES_SAVE_API, { user_id: user.id, menus: buildPrivilegePayload(tree) });
    };

    const handleClearOverrides = () => {
        clearOverrides(ADMIN_USER_OVERRIDES_DELETE_ALL_API, { user_id: user.id });
    };

    return (
        <Modal isOpen toggle={onClose} size="xl" centered scrollable>
            <ModalHeader toggle={onClose}>
                Manage Access — {user.username || `${user.first_name || ""} ${user.last_name || ""}`.trim()}
            </ModalHeader>
            <ModalBody>
                <div className="d-flex align-items-end gap-2 mb-4">
                    <div style={{ minWidth: 240 }}>
                        <label className="form-label mb-1">Role</label>
                        <Input type="select" value={selectedRoleId} onChange={(e) => setSelectedRoleId(e.target.value)}>
                            <option value="">No role</option>
                            {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </Input>
                    </div>
                    <Button color="primary" onClick={handleAssignRole} disabled={assigning || !selectedRoleId}>Assign</Button>
                    <Button color="danger" outline onClick={handleRemoveRole} disabled={removingRole || !user.role_id}>Remove Role</Button>
                </div>

                <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0">Per-menu Overrides</h6>
                    <Button size="sm" color="danger" outline onClick={handleClearOverrides} disabled={clearing}>Clear All Overrides</Button>
                </div>

                {overridesLoading ? (
                    <div className="d-flex justify-content-center mt-5"><GridLoader color="#556ee6" /></div>
                ) : (
                    <MenuPrivilegeTree nodes={tree} mode="user" onChange={setTree} lockedIds={lockedMenuIds} />
                )}
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" onClick={onClose}>Close</Button>
                <Button color="primary" onClick={handleSaveOverrides} disabled={saving}>Save Overrides</Button>
            </ModalFooter>
        </Modal>
    );
};

export default UserOverridesPanel;
