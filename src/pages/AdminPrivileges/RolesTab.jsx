import React, { useEffect, useMemo, useState } from "react";
import { Button } from "reactstrap";
import { RiDeleteBinLine, RiEditLine } from "react-icons/ri";
import { GridLoader } from "react-spinners";
import TableContainer from "../../components/Table/TableContainer";
import DeleteModal from "../../components/Common/DeleteModal";
import RoleFormModal from "../../components/AdminPrivileges/RoleFormModal";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { usePutApiCall } from "../../hooks/usePutApuCall";
import { useDeleteApiCall } from "../../hooks/useDeleteApiCall";
import ToasterProvider from "../../helpers/ToasterProvider";
import { ADMIN_ROLES_API } from "../../api";

const RolesTab = () => {
    const { apifunc: fetchRoles, data, loading } = useGetApiCall();
    const { ErrorToaster, SucceesToaster } = ToasterProvider();

    const [formOpen, setFormOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const load = () => fetchRoles(`${ADMIN_ROLES_API}?search=&is_active=true`);
    useEffect(() => { load(); }, []);

    const closeAndReload = () => { setFormOpen(false); load(); };
    const { apifunc: createRole, loading: creating } = usePostApiCall(closeAndReload, "Role created successfully");
    const { apifunc: updateRole, loading: updating } = usePutApiCall("Role updated successfully", closeAndReload);
    const { apifunc: deleteRole, loading: deleting, error: deleteError } = useDeleteApiCall();

    useEffect(() => { if (deleteError) ErrorToaster(deleteError); }, [deleteError]);

    const roles = useMemo(() => (Array.isArray(data) ? data : data?.results || []), [data]);

    const handleSubmit = (formData, id) => {
        if (id) updateRole(`${ADMIN_ROLES_API}${id}/`, formData);
        else createRole(ADMIN_ROLES_API, formData);
    };

    const handleDelete = async () => {
        const result = await deleteRole(`${ADMIN_ROLES_API}${deleteTarget.id}/`);
        if (result) {
            SucceesToaster("Role deleted successfully");
            setDeleteTarget(null);
            load();
        }
    };

    const columns = useMemo(() => [
        { header: "Name", accessorKey: "name" },
        { header: "Description", accessorKey: "description", enableColumnFilter: false, cell: ({ getValue }) => getValue() || "--" },
        {
            header: "Status", accessorKey: "is_active", enableColumnFilter: false,
            cell: ({ getValue }) => <span className={`badge bg-${getValue() ? "success" : "secondary"}`}>{getValue() ? "Active" : "Inactive"}</span>,
        },
        {
            header: "Actions", accessorKey: "actions", enableSorting: false, enableColumnFilter: false,
            cell: ({ row }) => (
                <div className="d-flex gap-2 justify-content-center">
                    <Button size="sm" color="primary" outline onClick={() => { setSelectedRole(row.original); setFormOpen(true); }}>
                        <RiEditLine />
                    </Button>
                    <Button size="sm" color="danger" outline onClick={() => setDeleteTarget(row.original)}>
                        <RiDeleteBinLine />
                    </Button>
                </div>
            ),
        },
    ], []);

    return (
        <div>
            <div className="d-flex justify-content-end mb-3">
                <Button color="primary" onClick={() => { setSelectedRole(null); setFormOpen(true); }}>+ New Role</Button>
            </div>

            {loading ? (
                <div className="d-flex justify-content-center mt-5"><GridLoader color="#556ee6" /></div>
            ) : (
                <TableContainer
                    columns={columns}
                    data={roles}
                    isGlobalFilter={true}
                    isPagination={true}
                    isCustomPageSize={true}
                    pagination="pagination"
                    paginationWrapper="dataTables_paginate paging_simple_numbers"
                    SearchPlaceholder="Search roles..."
                    tableClass="table-bordered table-nowrap"
                />
            )}

            <RoleFormModal
                isOpen={formOpen}
                toggle={() => setFormOpen(false)}
                initialData={selectedRole}
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

export default RolesTab;
