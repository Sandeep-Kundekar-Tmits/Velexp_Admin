import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Badge, Button } from "@/components/ui"
import TableContainer from "../../components/Table/TableContainer"
import usePostApiCall from "../../hooks/usePostApiCall"
import { useDeleteApiCall } from "../../hooks/useDeleteApiCall"
import { EMPLOYEE_LIST, DELETE_EMPLOYEE } from "../../api"
import MainHeaderComp from "../../components/MainHeaderCom"
import DeleteModal from "../../components/Common/DeleteModal"
import Loader from "@/Loaders/Loader"

const EmployeeList = () => {
    useEffect(() => { document.title = "Employee Management" }, [])

    const navigate = useNavigate()
    const { apifunc: getEmployees, data, loading } = usePostApiCall()
    const { apifunc: deleteEmployee, loading: deleteLoading } = useDeleteApiCall()

    const [employees, setEmployees] = useState([])
    const [selectedInfo, setSelectedInfo] = useState(null)
    const [showDelete, setShowDelete] = useState(false)

    useEffect(() => { getEmployees(EMPLOYEE_LIST, { page: "1" }) }, [getEmployees])

    useEffect(() => {
        if (data) setEmployees(data?.results?.results || data?.results || data || [])
    }, [data])

    const handleView = useCallback((rowData) => navigate(`/employees/${rowData?.id}`), [navigate])
    const handleEdit = useCallback((rowData) => navigate(`/employees/edit/${rowData?.id}`), [navigate])
    const handleAdd = useCallback(() => navigate("/employees/add"), [navigate])

    const handleDeleteClick = useCallback((rowData) => {
        setSelectedInfo(rowData)
        setShowDelete(true)
    }, [])

    const onDelete = async () => {
        const isDeleted = await deleteEmployee(`${DELETE_EMPLOYEE}${selectedInfo?.id}/`)
        if (isDeleted) {
            setShowDelete(false)
            setEmployees((prev) => prev.filter((ele) => ele?.id !== selectedInfo?.id))
        }
    }

    const columns = useMemo(() => [
        { header: "Employee Code", accessorKey: "employee_code", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Name", accessorKey: "name", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Email", accessorKey: "email", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Phone", accessorKey: "phone", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Designation", accessorKey: "designation", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        {
            header: "Status", accessorKey: "is_active", enableSorting: true,
            cell: ({ getValue }) => <Badge color={getValue() ? "success" : "secondary"} pill>{getValue() ? "Active" : "Inactive"}</Badge>,
        },
        {
            header: "Actions", id: "actions", enableSorting: false,
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button color="success" size="sm" onClick={() => handleView(row.original)}>View</Button>
                    <Button color="primary" size="sm" onClick={() => handleEdit(row.original)}>Edit</Button>
                    <Button color="danger" size="sm" onClick={() => handleDeleteClick(row.original)}>Delete</Button>
                </div>
            ),
        },
    ], [handleView, handleEdit, handleDeleteClick])

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <div className="page-fit-body relative z-10 pb-4">
                <MainHeaderComp
                    title="Employee Management"
                    subTitle="Employee directory — KYC, bank details and vehicle assignments."
                    extraFields={<Button color="primary" onClick={handleAdd}>+ Add Employee</Button>}
                />

                {loading ? (
                    <Loader message="Loading Employees…" fullscreen={false} />
                ) : (
                    <div className="page-fit-body mt-4">
                        <TableContainer
                            columns={columns}
                            data={employees}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers"
                            tableClass="table-nowrap dt-responsive w-full dataTable no-footer"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="72vh"
                        />
                    </div>
                )}
            </div>

            <DeleteModal show={showDelete} onCloseClick={() => setShowDelete(false)} onDeleteClick={onDelete} loading={deleteLoading} />
        </div>
    )
}

export default EmployeeList
