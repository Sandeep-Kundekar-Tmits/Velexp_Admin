import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "reactstrap";
import { useNavigate } from "react-router-dom";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GET_ALL_USER_LIST, GET_USER_API } from "../../api";
import { GridLoader } from "react-spinners";
import usePostApiCall from "../../hooks/usePostApiCall";
import MainHeaderCom from "../../components/MainHeaderCom";
const UserManagementList = () => {
    // Document title effect
    useEffect(() => {
        document.title = "User Management";
    }, []);

    const navigate = useNavigate();
    const { apifunc: getUser, data, loading } = usePostApiCall();

    // Memoized navigation handlers
    const handleEdit = useCallback((rowData) => {
        navigate(`/edit-user/${rowData?.id}`);
    }, [navigate]);

    const handleView = useCallback((rowData) => {
        navigate(`/user/${rowData?.id}`);
    }, [navigate]);

    const handleAddUser = useCallback(() => {
        navigate("/add-user");
    }, [navigate]);

    // Memoized columns configuration
    const columns = useMemo(() => [
        {
            header: 'First name',
            accessorKey: 'first_name',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Last name',
            accessorKey: 'last_name',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Email',
            accessorKey: 'email',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Phone',
            accessorKey: 'phone',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Customer Type',
            accessorKey: 'cust_type',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ row }) => row.original.cust_type?.type_of_cust?.trim() || "--",
        },
        {
            header: 'Customer name',
            accessorKey: 'customer_name',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Actions',
            accessorKey: 'actions',
            enableColumnFilter: false,
            enableSorting: false,
            cell: ({ row }) => (
                <div className="d-flex gap-2">
                    <Button color="success" size="sm" onClick={() => handleView(row.original)}>
                        View
                    </Button>
                    <Button color="primary" size="sm" onClick={() => handleEdit(row.original)}>
                        Edit
                    </Button>
                </div>
            ),
        },
    ], [handleEdit, handleView]);

    // Data fetching effect
    useEffect(() => {
        let userId = JSON.parse(localStorage.getItem("authUser"))?.user?.id
        getUser(GET_ALL_USER_LIST, {
            "user_id": userId
        });
    }, [getUser]);

    // Process data only when needed
    const processedData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        return data.map(info => ({
            ...info,
            first_name: info.first_name,
            last_name: info.last_name,
            email: info.email,
            phone: info.phone,
            customer_name: info.customer_name,
        })).filter(ele => {
            return ele?.customer_name
        })
    }, [data]);

    if (loading) {
        return (
            <div style={{ height: "100vh" }} className="container-fluid  d-flex flex-column justify-content-center align-items-center">
                <GridLoader size={20} />
                <p className="mt-5 h5">Loading...</p>
            </div>
        )
    }

    return (
        <div className="page-content py-0 px-0" style={{ overflowX: 'hidden' }}>
            <div className="bg-white sticky-top" style={{ top: '0px', zIndex: 1001, width: '100%' }}>
                <MainHeaderCom
                    title="User Management"
                    extraFields={
                        <Button color="primary" onClick={handleAddUser}>
                            + Add User
                        </Button>
                    }
                />
            </div>
            <div className="container-fluid px-2">
                <div className="mt-3">
                    <TableContainer
                        columns={columns}
                        data={processedData}
                        isGlobalFilter={true}
                        isPagination={true}
                        isCustomPageSize={true}
                        SearchPlaceholder="Search From Table"
                        pagination="pagination"
                        buttonClass="btn-success"
                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                        tableClass="table-bordered table-nowrap dt-responsive nowrap w-100 dataTable no-footer dtr-inline"
                        isStickyHeader={true}
                        stickyTop={0}
                        tableHeight="72vh"
                    />
                </div>
            </div>
        </div>
    );
};

export default UserManagementList;