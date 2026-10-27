import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui"
import TableContainer from "../../components/Table/TableContainer"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../helpers/ToasterProvider"
import { rawRequest } from "@/lib/http"
import { useExcelExport } from "../../hooks/useExcelExport"
import { GET_PINCODE_SERVICE_CENTERS } from "../../api"

const titleCase = (key) =>
    key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

const MAX_PAGES = 500 // safety cap against a runaway/looping `next` link

const AllPincodes = () => {
    useEffect(() => { document.title = "All Pincodes" }, [])

    const { ErrorToaster } = ToasterProvider()
    const { exportToExcel, isExporting } = useExcelExport()
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(true)

    // Follows the backend's own pagination (`next`) through to the end before
    // rendering, so search and sort run over the whole dataset instead of just
    // whatever page size the backend defaults to.
    useEffect(() => {
        let cancelled = false

        const loadAll = async () => {
            setLoading(true)
            let all = []
            let url = GET_PINCODE_SERVICE_CENTERS
            let pages = 0
            try {
                while (url && pages < MAX_PAGES && !cancelled) {
                    const { ok, data } = await rawRequest(url, { method: "GET" })
                    if (!ok) {
                        ErrorToaster(data?.detail || data?.error || "Failed to load pincodes")
                        break
                    }
                    const pageRows = Array.isArray(data) ? data : data?.results?.results || data?.results || []
                    all = all.concat(pageRows)
                    url = Array.isArray(data) ? null : data?.next || null
                    pages += 1
                }
            } catch (e) {
                console.error("Load pincode service centres failed:", e)
                ErrorToaster("Failed to load pincodes")
            }
            if (!cancelled) {
                setRows(all)
                setLoading(false)
            }
        }

        loadAll()
        return () => { cancelled = true }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // The response shape isn't documented, so the columns come from whatever
    // keys the first row has rather than guessed field names. The raw id is
    // dropped; the table's own row numbers stand in for it.
    const columns = useMemo(() => {
        if (!rows.length) return []
        return [
            {
                header: "SL No",
                id: "sl_no",
                enableColumnFilter: false,
                cell: ({ row }) => row.index + 1,
            },
            ...Object.keys(rows[0])
                .filter((key) => key !== "id")
                .map((key) => ({
                    header: titleCase(key),
                    accessorKey: key,
                    enableColumnFilter: false,
                    enableSorting: true,
                    cell: ({ getValue }) => {
                        const v = getValue()
                        // active flag: true -> Active, false -> Inactive
                        if (/^(is_)?active$/i.test(key) && (typeof v === "boolean" || v === "true" || v === "false" || v === 1 || v === 0)) {
                            const on = v === true || v === "true" || v === 1
                            return <Badge color={on ? "success" : "secondary"} pill>{on ? "Active" : "Inactive"}</Badge>
                        }
                        return v === null || v === undefined || v === "" ? "—" : String(v)
                    },
                })),
        ]
    }, [rows])

    const downloadExcel = () => exportToExcel(rows.map(({ id, ...rest }) => rest), "All_Pincodes")

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="All Pincodes"
                subTitle="Pincode to service centre mapping."
            />

            <div className="page-fit-body relative z-10 pb-4">
                <div className="page-fit-body mt-1">
                    {loading ? (
                        <Loader message="Loading Pincodes…" fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={columns}
                            headerAlign="left"
                            data={rows}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            isDownloadExcle={true}
                            onDownloadExcle={downloadExcel}
                            ExcleLoading={isExporting}
                            SearchPlaceholder="Search From Table"
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers"
                            tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="65vh"
                            defaultPageSize={50}
                        />
                    )}
                </div>
            </div>
        </div>
    )
}

export default AllPincodes
