// COD-pending reconciliation lookup: find a specific AWB/UTR/manifest number
// regardless of when it was delivered, or narrow the current 30-day/service
// centre browse view by service centre and/or employee.
// Rendered as a tab inside Auto Reconciliation (see index.jsx).
import { useMemo, useState } from "react"
import { Button, Card, CardBody, Input, Label, Spinner } from "@/components/ui"
import { FaFileExcel } from "react-icons/fa"
import TableContainer from "../../../components/Table/TableContainer"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { COD_PENDING_REPORT, DOWNLOAD_COD_PENDING_REPORT } from "../../../api"
import { authFetch } from "@/lib/http"

const CodPendingReport = () => {
    const { ErrorToaster } = ToasterProvider()

    const [search, setSearch] = useState("")
    const [serviceCenter, setServiceCenter] = useState("")
    const [employee, setEmployee] = useState("")

    const [rows, setRows] = useState([])
    const [totalCount, setTotalCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [hasSearched, setHasSearched] = useState(false)

    const buildPayload = () => {
        const authUser = JSON.parse(localStorage.getItem("authUser") || "{}")
        const payload = { user_id: authUser?.user?.id }
        if (search.trim()) payload.search = search.trim()
        if (serviceCenter.trim()) payload.service_center = serviceCenter.trim()
        if (employee.trim()) payload.employee = employee.trim()
        return payload
    }

    const fetchReport = async () => {
        setLoading(true)
        setHasSearched(true)
        try {
            const res = await authFetch(COD_PENDING_REPORT, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload()),
            })
            const json = await res.json().catch(() => null)
            if (!res.ok) {
                ErrorToaster(json?.error || "Failed to load report")
                setRows([])
                setTotalCount(0)
                return
            }
            // Response envelope isn't documented for this endpoint, so every
            // shape this app's other admin-reports endpoints use is tried.
            const data = Array.isArray(json) ? json
                : Array.isArray(json?.results) ? json.results
                : Array.isArray(json?.cod_pending) ? json.cod_pending
                : Array.isArray(json?.payments) ? json.payments
                : Array.isArray(json?.shipments) ? json.shipments
                : []
            setRows(data)
            setTotalCount(json?.total ?? json?.count ?? json?.total_count ?? data.length)
        } catch (err) {
            console.error("COD pending report fetch error:", err)
            ErrorToaster("Failed to load report")
            setRows([])
            setTotalCount(0)
        } finally {
            setLoading(false)
        }
    }

    const downloadExcel = async () => {
        setIsExporting(true)
        try {
            const res = await authFetch(DOWNLOAD_COD_PENDING_REPORT, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(buildPayload()),
            })
            if (!res.ok) {
                const errJson = await res.json().catch(() => null)
                throw new Error(errJson?.error || `Server error: ${res.status}`)
            }
            const blob = await res.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `COD_Pending_Report_${new Date().toISOString().split("T")[0]}.xlsx`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
        } catch (err) {
            console.error("COD pending report download error:", err)
            ErrorToaster(err.message || "Download failed")
        } finally {
            setIsExporting(false)
        }
    }

    // Row shape isn't fixed in advance either, so columns are derived from
    // whatever the response actually carries rather than a hardcoded (and
    // possibly wrong) list of accessor keys.
    const columns = useMemo(() => {
        if (!rows.length) return []
        return Object.keys(rows[0]).map((key) => ({
            header: key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
            accessorKey: key,
            enableSorting: true,
            cell: ({ getValue }) => {
                const v = getValue()
                if (v === null || v === undefined || v === "") return "—"
                if (typeof v === "boolean") return v ? "Yes" : "No"
                return String(v)
            },
        }))
    }, [rows])

    const handleKeyDown = (e) => { if (e.key === "Enter") fetchReport() }

    return (
        <div className="flex min-h-0 flex-1 flex-col">
            <p className="mb-3 text-xs text-ink-muted">
                Look up a specific AWB, UTR or manifest number regardless of when it was delivered, or browse the current pending-COD view narrowed by service centre and/or employee.
            </p>

            <Card className="mb-3">
                <CardBody className="flex flex-wrap items-end gap-3 py-3">
                    <div className="flex w-full flex-col gap-1.5 sm:w-64">
                        <Label className="mb-0 text-xs font-bold text-ink-muted">AWB / UTR / Manifest No</Label>
                        <Input
                            type="text"
                            placeholder="e.g. VIN0070174, UTR123456789…"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1.5 sm:w-40">
                        <Label className="mb-0 text-xs font-bold text-ink-muted">Service Center</Label>
                        <Input
                            type="text"
                            placeholder="e.g. DEL01"
                            value={serviceCenter}
                            onChange={(e) => setServiceCenter(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1.5 sm:w-48">
                        <Label className="mb-0 text-xs font-bold text-ink-muted">Employee</Label>
                        <Input
                            type="text"
                            placeholder="e.g. Rakesh"
                            value={employee}
                            onChange={(e) => setEmployee(e.target.value)}
                            onKeyDown={handleKeyDown}
                        />
                    </div>

                    <Button color="primary" onClick={fetchReport} disabled={loading}>
                        {loading ? "Loading..." : "Search"}
                    </Button>
                    <Button
                        color="success"
                        className="ml-auto flex items-center gap-1"
                        onClick={downloadExcel}
                        disabled={isExporting}
                    >
                        {isExporting ? (
                            <><Spinner size="sm" className="mr-1" /> Exporting...</>
                        ) : (
                            <><FaFileExcel size={14} aria-hidden="true" /> Export Excel</>
                        )}
                    </Button>
                </CardBody>
            </Card>

            <Card className="flex min-h-0 flex-1 flex-col">
                <CardBody className="flex min-h-0 flex-1 flex-col p-0">
                    <div className="flex items-center justify-between border-b border-white/8 px-4 py-2">
                        <span className="text-xs font-bold text-ink-muted">
                            {loading
                                ? "Loading…"
                                : hasSearched
                                    ? `${totalCount.toLocaleString()} record${totalCount === 1 ? "" : "s"}`
                                    : "Search or browse to load results"}
                        </span>
                    </div>
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <Spinner color="primary" />
                        </div>
                    ) : (
                        <div className="p-3">
                            <TableContainer
                                columns={columns}
                                data={rows}
                                isGlobalFilter={true}
                                isPagination={true}
                                isCustomPageSize={true}
                                SearchPlaceholder="Search loaded rows..."
                                tableClass="table-nowrap mb-0"
                                fillHeight
                                tableHeight="50vh"
                            />
                        </div>
                    )}
                </CardBody>
            </Card>
        </div>
    )
}

export default CodPendingReport
