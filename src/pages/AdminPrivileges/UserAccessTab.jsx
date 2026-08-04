import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Button, Input } from "@/components/ui";
import { LoaderMark } from "@/Loaders/Loader";
import TableContainer from "../../components/Table/TableContainer";
import UserOverridesPanel from "../../components/AdminPrivileges/UserOverridesPanel";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { ADMIN_USERS_SEARCH_API } from "../../api";

const UserAccessTab = () => {
    const { apifunc: fetchUsers, data, loading } = useGetApiCall();

    const [search, setSearch] = useState("");
    const [hasRole, setHasRole] = useState("");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [selectedUser, setSelectedUser] = useState(null);

    const load = useCallback((targetPage = 1) => {
        const params = new URLSearchParams({
            search,
            is_active: "true",
            has_role: hasRole,
            page: String(targetPage),
            page_size: String(pageSize),
        });
        fetchUsers(`${ADMIN_USERS_SEARCH_API}?${params.toString()}`);
        setPage(targetPage);
    }, [fetchUsers, search, hasRole, pageSize]);

    useEffect(() => { load(1); }, []);

    const rows = useMemo(() => (Array.isArray(data) ? data : data?.results || []), [data]);
    const total = useMemo(() => (Array.isArray(data) ? data.length : data?.count ?? rows.length), [data, rows]);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    const columns = useMemo(() => [
        { header: "Username", accessorKey: "username" },
        {
            header: "Name", accessorKey: "first_name", enableColumnFilter: false,
            cell: ({ row }) => `${row.original.first_name || ""} ${row.original.last_name || ""}`.trim() || "--",
        },
        { header: "Email", accessorKey: "email", enableColumnFilter: false, cell: ({ getValue }) => getValue() || "--" },
        {
            header: "Role", accessorKey: "role_name", enableColumnFilter: false,
            cell: ({ getValue }) => getValue() || <span className="text-ink-muted">No role</span>,
        },
        { header: "Overrides", accessorKey: "override_count", enableColumnFilter: false, cell: ({ getValue }) => getValue() ?? 0 },
        {
            header: "Actions", accessorKey: "actions", enableSorting: false, enableColumnFilter: false,
            cell: ({ row }) => (
                <Button size="sm" color="primary" onClick={() => setSelectedUser(row.original)}>Manage Access</Button>
            ),
        },
    ], []);

    return (
        <div>
            <div className="flex flex-wrap gap-2 mb-4">
                <Input
                    style={{ maxWidth: 260 }}
                    placeholder="Search username / name / email"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && load(1)}
                />
                <Input type="select" style={{ maxWidth: 200 }} value={hasRole} onChange={(e) => setHasRole(e.target.value)}>
                    <option value="">All users</option>
                    <option value="true">Has role assigned</option>
                    <option value="false">No role assigned</option>
                </Input>
                <Button color="primary" onClick={() => load(1)}>Search</Button>
            </div>

            {loading ? (
                <div className="flex justify-center mt-12"><LoaderMark /></div>
            ) : (
                <>
                    <TableContainer
                        columns={columns}
                        data={rows}
                        isGlobalFilter={false}
                        isPagination={false}
                        tableClass="table-bordered table-nowrap"
                    />

                    <div className="flex justify-between items-center mt-4 px-4 py-2 bg-canvas rounded border">
                        <span className="text-ink-muted text-xs">
                            Showing {total > 0 ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, total)} of {total} entries
                        </span>
                        <div className="flex gap-1">
                            <Button size="sm" color="secondary" outline disabled={page <= 1} onClick={() => load(page - 1)}>‹ Prev</Button>
                            <Button size="sm" color="secondary" outline disabled={page >= totalPages} onClick={() => load(page + 1)}>Next ›</Button>
                        </div>
                    </div>
                </>
            )}

            {selectedUser && (
                <UserOverridesPanel
                    user={selectedUser}
                    onClose={() => setSelectedUser(null)}
                    onRoleChanged={() => load(page)}
                />
            )}
        </div>
    );
};

export default UserAccessTab;
