// Standalone listing of exited employees -- separate from the per-employee
// "Exit History" modal on ViewEmployee.jsx (that one is scoped to a single
// employee, matching the exit-history API itself, which only accepts
// {employee_code}; there's no "list every exit record" endpoint). This page
// instead lists currently-inactive employees via the existing employee
// get-list endpoint, showing their exit fields directly, with a per-row
// "History" button for the rare re-hired-then-exited-again case where a
// single employee has more than one exit on record.
import { useCallback, useEffect, useMemo, useState } from "react"
import { Badge, Button, Input, Pagination, PaginationItem, PaginationLink } from "@/components/ui"
import { History } from "lucide-react"
import TableContainer from "../../components/Table/TableContainer"
import usePostApiCall from "../../hooks/usePostApiCall"
import { EMPLOYEE_LIST } from "../../api"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import { formatDisplayDate } from "../../helpers/formatDisplayDate"
import ExitHistoryModal from "../../components/UserManagement/ExitHistoryModal"

const orDash = (v) => (v === null || v === undefined || v === "" ? "—" : v)

const ExitHistoryList = () => {
    useEffect(() => { document.title = "Exit History" }, [])

    const { apifunc: getEmployees, data, loading } = usePostApiCall()

    const [employees, setEmployees] = useState([])
    const [page, setPage] = useState(1)
    const [searchInput, setSearchInput] = useState("")
    const [search, setSearch] = useState("")
    const [historyCode, setHistoryCode] = useState(null)
    const [showHistory, setShowHistory] = useState(false)

    const load = useCallback((targetPage, targetSearch) => {
        // is_active is passed as a best-effort server-side narrow; the client
        // filter below is the real guarantee regardless of whether this
        // backend's get-list honours it.
        getEmployees(EMPLOYEE_LIST, { page: String(targetPage), search: targetSearch, is_active: false })
    }, [getEmployees])

    useEffect(() => { load(1, "") }, [load])

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
        const rows = data?.results?.results || data?.results || data || []
        setEmployees((Array.isArray(rows) ? rows : []).filter((row) => row?.is_active !== true))
    }, [data])

    // This is the count of exited employees on the current server page, not
    // a confirmed grand total -- get-list's own `count` reflects everyone
    // matching the search (active + inactive) if it doesn't honour the
    // is_active filter sent above, so it isn't trustworthy here.
    const total = employees.length
    const hasNext = !!data?.next
    const hasPrevious = !!data?.previous

    const handleViewHistory = useCallback((row) => {
        setHistoryCode(row?.employee_code)
        setShowHistory(true)
    }, [])

    const columns = useMemo(() => [
        { header: "Employee Code", accessorKey: "employee_code", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        {
            header: "Name", id: "name", enableSorting: true,
            cell: ({ row }) => row.original.name || [row.original.first_name, row.original.last_name].filter(Boolean).join(" ") || "—",
        },
        {
            header: "Designation", id: "designation",
            cell: ({ row }) => orDash(row.original.designation_name || row.original.designation),
        },
        {
            header: "Department", id: "department",
            cell: ({ row }) => orDash(row.original.department_name || row.original.department),
        },
        {
            header: "Date of Exit", accessorKey: "date_of_exit", enableSorting: true,
            cell: ({ getValue }) => orDash(formatDisplayDate(getValue()) || getValue()),
        },
        { header: "Exit Remark", accessorKey: "exit_remark", cell: ({ getValue }) => orDash(getValue()) },
        { header: "Exit Marked By", accessorKey: "exit_marked_by", cell: ({ getValue }) => orDash(getValue()) },
        {
            header: "Exit Marked At", accessorKey: "exit_marked_at",
            cell: ({ getValue }) => orDash(formatDisplayDate(getValue()) || getValue()),
        },
        {
            header: "Status", accessorKey: "is_active", enableSorting: false,
            cell: () => <Badge color="secondary" pill>Inactive</Badge>,
        },
        {
            header: "Actions", id: "actions", enableSorting: false,
            cell: ({ row }) => (
                <Button color="secondary" size="sm" className="flex items-center gap-1" onClick={() => handleViewHistory(row.original)}>
                    <History size={14} /> History
                </Button>
            ),
        },
    ], [handleViewHistory])

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <div className="page-fit-body relative z-10 pb-4">
                <MainHeaderComp
                    title="Exit History"
                    subTitle="Employees whose exit has been recorded — full record per employee via History."
                />

                <div className="flex justify-end mt-3" style={{ maxWidth: 320, marginLeft: "auto" }}>
                    <Input
                        type="text"
                        placeholder="Search exited employees…"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                </div>

                {loading ? (
                    <Loader message="Loading exit history…" fullscreen={false} />
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

                        <div className="flex justify-between items-center mt-3">
                            <span className="text-ink-muted text-sm">
                                {total} exited employee{total === 1 ? "" : "s"} on this page{search ? ` matching "${search}"` : ""} — page {page}
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

            <ExitHistoryModal employeeCode={historyCode} isOpen={showHistory} setIsOpen={setShowHistory} />
        </div>
    )
}

export default ExitHistoryList
