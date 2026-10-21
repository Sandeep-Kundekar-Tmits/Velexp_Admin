import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQuery } from "@tanstack/react-query"
import Select from "react-select"
import { Badge, Button, Input, Label, Pagination, PaginationItem, PaginationLink } from "@/components/ui"
import { UserX, UserCheck } from "lucide-react"
import TableContainer from "../../components/Table/TableContainer"
import usePostApiCall from "../../hooks/usePostApiCall"
import { EMPLOYEE_LIST } from "../../api"
import MainHeaderComp from "../../components/MainHeaderCom"
import MarkExitModal from "../../components/UserManagement/MarkExitModal"
import ReverseExitModal from "../../components/UserManagement/ReverseExitModal"
import Loader from "@/Loaders/Loader"
import { qk } from "@/lib/queryKeys"
import { fetchServiceCenters, toServiceCenterOptions } from "@/services/reference.service"
import { customStyles, CheckboxOption, SelectedCountValue } from "../../helpers/CustomStyle"

const PAGE_SIZE = 50

/* Checkbox per option + a "N selected" count in the control, instead of a
   chip strip -- see CustomStyle.jsx for why every multi-select filter in
   this app uses this contract. */
const MULTI_SELECT_PROPS = {
    isMulti: true,
    isClearable: true,
    hideSelectedOptions: false,
    closeMenuOnSelect: false,
    styles: customStyles,
    components: { Option: CheckboxOption, ValueContainer: SelectedCountValue },
    menuPortalTarget: typeof document !== "undefined" ? document.body : undefined,
    menuPosition: "fixed",
}

const EmployeeList = () => {
    useEffect(() => { document.title = "Employee Management" }, [])

    const navigate = useNavigate()
    const { apifunc: getEmployees, data, loading } = usePostApiCall()

    const [employees, setEmployees] = useState([])
    const [exitTarget, setExitTarget] = useState(null)
    const [showMarkExit, setShowMarkExit] = useState(false)
    const [showReverseExit, setShowReverseExit] = useState(false)
    const [page, setPage] = useState(1)
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [selectedServiceCenters, setSelectedServiceCenters] = useState([])

    // Cached 30min via react-query instead of refetched on every mount --
    // same pattern every other service-centre filter in this app uses.
    const { data: serviceCenterList } = useQuery({
        queryKey: qk.reference.serviceCenters(),
        queryFn: fetchServiceCenters,
        staleTime: 30 * 60_000,
    })
    const scOptions = useMemo(() => toServiceCenterOptions(serviceCenterList), [serviceCenterList])

    const load = useCallback((targetPage, targetSearch, targetServiceCenters) => {
        const payload = { page: String(targetPage), page_size: String(PAGE_SIZE), search: targetSearch }
        // Default is "All" -- nothing selected means no filter at all,
        // rather than sending an empty list. Only when specific service
        // centres are picked does this key go on the request.
        if (targetServiceCenters?.length) {
            payload.service_center_code = targetServiceCenters.map((sc) => sc.value)
        }
        getEmployees(EMPLOYEE_LIST, payload)
    }, [getEmployees])

    useEffect(() => { load(1, "", []) }, [load])

    // Debounced so typing doesn't fire a request per keystroke -- 500ms
    // matches TableContainer's own search box elsewhere in the app. A new
    // search always restarts at page 1, since the previous page number may
    // not exist in the filtered result set.
    useEffect(() => {
        const timeout = setTimeout(() => {
            if (searchInput !== search) {
                setSearch(searchInput)
                setPage(1)
                load(1, searchInput, selectedServiceCenters)
            }
        }, 500)
        return () => clearTimeout(timeout)
    }, [searchInput, search, load, selectedServiceCenters])

    const handleServiceCenterChange = (opts) => {
        const next = opts || []
        setSelectedServiceCenters(next)
        setPage(1)
        load(1, search, next)
    }

    const goToPage = (targetPage) => {
        if (targetPage < 1) return
        setPage(targetPage)
        load(targetPage, search, selectedServiceCenters)
    }

    useEffect(() => {
        // Response shape: {count, next, previous, results: {message, results: [...]}}
        // -- results is an object carrying the array, not the array itself.
        if (data) setEmployees(data?.results?.results || data?.results || data || [])
    }, [data])

    const total = data?.count ?? employees.length
    const hasNext = !!data?.next
    const hasPrevious = !!data?.previous
    const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
    const rangeEnd = Math.min(page * PAGE_SIZE, total)

    const handleView = useCallback((rowData) => navigate(`/employees/${rowData?.id}`), [navigate])
    const handleEdit = useCallback((rowData) => navigate(`/employees/edit/${rowData?.id}`), [navigate])
    const handleAdd = useCallback(() => navigate("/employees/add"), [navigate])

    const handleMarkExitClick = useCallback((rowData) => {
        setExitTarget(rowData)
        setShowMarkExit(true)
    }, [])

    const handleReverseExitClick = useCallback((rowData) => {
        setExitTarget(rowData)
        setShowReverseExit(true)
    }, [])

    // Flip the row to Inactive locally rather than a full refetch.
    const onExitRecorded = () => {
        setEmployees((prev) => prev.map((ele) => (ele?.id === exitTarget?.id ? { ...ele, is_active: false } : ele)))
    }

    const onExitReversed = () => {
        setEmployees((prev) => prev.map((ele) => (ele?.id === exitTarget?.id ? { ...ele, is_active: true } : ele)))
    }

    const columns = useMemo(() => [
        {
            // row.index is the row's position within this page's own data,
            // not across the whole result set -- the page offset makes page
            // 2 continue at 51 instead of restarting at 1.
            header: "Sl. No", id: "slNo", enableSorting: false,
            cell: ({ row }) => (page - 1) * PAGE_SIZE + row.index + 1,
        },
        { header: "Employee Code", accessorKey: "employee_code", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        {
            header: "Name", id: "name", enableSorting: true,
            cell: ({ row }) => row.original.name || [row.original.first_name, row.original.last_name].filter(Boolean).join(" ") || "—",
        },
        { header: "Email", accessorKey: "email", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        {
            header: "Phone", id: "phone", enableSorting: true,
            cell: ({ row }) => row.original.mobile_no || row.original.phone || "—",
        },
        {
            header: "Designation", id: "designation", enableSorting: true,
            cell: ({ row }) => row.original.designation_name || row.original.designation || "—",
        },
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
                    {row.original.is_active ? (
                        <Button color="secondary" size="sm" title="Mark Exit" onClick={() => handleMarkExitClick(row.original)}>
                            <UserX size={14} />
                        </Button>
                    ) : (
                        <Button color="success" size="sm" title="Reverse Exit" onClick={() => handleReverseExitClick(row.original)}>
                            <UserCheck size={14} />
                        </Button>
                    )}
                </div>
            ),
        },
    ], [page, handleView, handleEdit, handleMarkExitClick, handleReverseExitClick])

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <div className="page-fit-body relative z-10 pb-4">
                <MainHeaderComp
                    title="Employee Management"
                    subTitle="Employee directory — KYC, bank details and vehicle assignments."
                    extraFields={<Button color="primary" onClick={handleAdd}>+ Add Employee</Button>}
                />

                {/* Kept outside the loading branch below so the inputs never
                    unmount (and lose focus/selection) while a request is in flight. */}
                <div className="flex items-end justify-end gap-3 mt-3" style={{ marginLeft: "auto" }}>
                    <div className="flex w-60 flex-col gap-1.5">
                        <Label className="form-label m-0 font-bold text-ink-muted">Service Center</Label>
                        <Select
                            options={scOptions}
                            value={selectedServiceCenters}
                            onChange={handleServiceCenterChange}
                            placeholder="All service centers"
                            {...MULTI_SELECT_PROPS}
                        />
                    </div>
                    <div style={{ maxWidth: 320 }}>
                        <Input
                            type="text"
                            placeholder="Search employees…"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                        />
                    </div>
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
                                {total === 0
                                    ? `No employees found${search ? ` matching "${search}"` : ""}`
                                    : `Showing ${rangeStart} to ${rangeEnd} of ${total}${search ? ` matching "${search}"` : ""}`}
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

            <MarkExitModal employee={exitTarget} isOpen={showMarkExit} setIsOpen={setShowMarkExit} onSuccess={onExitRecorded} />
            <ReverseExitModal employee={exitTarget} isOpen={showReverseExit} setIsOpen={setShowReverseExit} onSuccess={onExitReversed} />
        </div>
    )
}

export default EmployeeList
