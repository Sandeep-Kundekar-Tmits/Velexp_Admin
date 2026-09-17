import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Badge, Button, Input, Pagination, PaginationItem, PaginationLink } from "@/components/ui"
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
    const [page, setPage] = useState(1)
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")

    const load = useCallback((targetPage, targetSearch) => {
        getEmployees(EMPLOYEE_LIST, { page: String(targetPage), search: targetSearch })
    }, [getEmployees])

    useEffect(() => { load(1, "") }, [load])

    // Debounced so typing doesn't fire a request per keystroke -- 500ms
    // matches TableContainer's own search box elsewhere in the app. A new
    // search always restarts at page 1, since the previous page number may
    // not exist in the filtered result set.
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchInput !== search) {
                setSearch(searchInput)
                setPage(1)
                load(1, searchInput)
            }
        }, 500)
        return () => clearTimeout(timeout)
    }, [searchInput, search, load])

    const goToPage = (targetPage) => {
        if (targetPage < 1) return
        setPage(targetPage)
        load(targetPage, search)
    }

    useEffect(() => {
        // Response shape: {count, next, previous, results: {message, results: [...]}}
        // -- results is an object carrying the array, not the array itself.
        if (data) setEmployees(data?.results?.results || data?.results || data || [])
    }, [data])

    const total = data?.count ?? employees.length
    const hasNext = !!data?.next
    const hasPrevious = !!data?.previous

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

                {/* Kept outside the loading branch below so the input never
                    unmounts (and loses focus) while a search request is in flight. */}
                <div className="flex justify-end mt-3" style={{ maxWidth: 320, marginLeft: "auto" }}>
                    <Input
                        type="text"
                        placeholder="Search employees…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                {loading ? (
                    <Loader message="Loading Employees…" fullscreen={false} />
                ) : (
                    <div className="page-fit-body mt-3">
                        <TableContainer
                            columns={columns}
                            data={employees}
                            isGlobalFilter={false}
                            isPagination={false}
                            isCustomPageSize={false}
                            tableClass="table-nowrap dt-responsive w-full dataTable no-footer"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="68vh"
                        />

                        {/* Server-driven, not TableContainer's own client-side pagination --
                            the API returns one page's worth of rows at a time (count/next/
                            previous), so paging through the in-memory array would only ever
                            show what happened to be on the current page. */}
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-ink-muted text-sm">
                                {total} employee{total === 1 ? "" : "s"}{search ? ` matching "${search}"` : ""} — page {page}
                            </span>
                            <Pagination>
                                <PaginationItem disabled={!hasPrevious}>
                                    <PaginationLink previous onClick={() => goToPage(page - 1)} />
                                </PaginationItem>
                                <PaginationItem active>
                                    <PaginationLink>{page}</PaginationLink>
                                </PaginationItem>
                                <PaginationItem disabled={!hasNext}>
                                    <PaginationLink next onClick={() => goToPage(page + 1)} />
                                </PaginationItem>
                            </Pagination>
                        </div>
                    </div>
                )}
            </div>

            <DeleteModal show={showDelete} onCloseClick={() => setShowDelete(false)} onDeleteClick={onDelete} loading={deleteLoading} />
        </div>
    )
}

export default EmployeeList
