import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft } from "lucide-react"
import { FaFileExcel } from "react-icons/fa"
import Select from "react-select"
import { Badge, Button, Input, Label, Spinner } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../helpers/CustomStyle"
import TableContainer from "../../components/Table/TableContainer"
import MainHeaderComp from "../../components/MainHeaderCom"
import SimpleModal from "../../components/SimpleModal"
import Loader from "@/Loaders/Loader"
import usePostApiCall from "../../hooks/usePostApiCall"
import useExcelParser from "../../hooks/useExcelParser"
import { useExcelExport } from "../../hooks/useExcelExport"
import ToasterProvider from "../../helpers/ToasterProvider"
import { SERVICE_CENTER_LIST, SERVICE_CENTRE_PINCODE_LIST, BULK_ASSIGN_SERVICE_CENTRE_PINCODES } from "../../api"

const ServiceCentrePincodes = () => {
    useEffect(() => { document.title = "Service Centre Pincodes" }, [])

    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()

    // service centre picker
    const { apifunc: getServiceCentres, data: serviceCentreData, loading: centresLoading } = usePostApiCall()
    const [serviceCentres, setServiceCentres] = useState([])
    const [selectedCentre, setSelectedCentre] = useState(null)

    useEffect(() => { getServiceCentres(SERVICE_CENTER_LIST, {}) }, [getServiceCentres])

    useEffect(() => {
        if (serviceCentreData) setServiceCentres(serviceCentreData?.results?.results || serviceCentreData?.results || serviceCentreData || [])
    }, [serviceCentreData])

    const centreOptions = useMemo(() => serviceCentres.map((sc) => ({
        value: sc?.service_center_code,
        label: sc?.company_name ? `${sc?.service_center_code} — ${sc?.company_name}` : sc?.service_center_code,
    })), [serviceCentres])

    // preselect from ?sc=<code>, e.g. the "Pincodes" action on the Service Centres list
    useEffect(() => {
        const code = searchParams.get("sc")
        if (!code || selectedCentre || !centreOptions.length) return
        const match = centreOptions.find((opt) => opt.value === code)
        if (match) setSelectedCentre(match)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [centreOptions])

    // existing pincode mappings for the selected centre -- /api/admin-panel/
    // is a plain DRF REST resource, unlike the "get-list"/{status:1} envelope
    // every other endpoint in this app uses, so this reads rawRequest's {ok}
    // flag directly rather than going through usePostApiCall/useGetApiCall.
    const [pincodeRows, setPincodeRows] = useState([])
    const [pincodesLoading, setPincodesLoading] = useState(false)

    const loadPincodes = useCallback(async (code) => {
        if (!code) { setPincodeRows([]); return }
        setPincodesLoading(true)
        try {
            const { ok, data } = await rawRequest(`${SERVICE_CENTRE_PINCODE_LIST}?service_center=${encodeURIComponent(code)}`, { method: "GET" })
            if (ok) setPincodeRows(Array.isArray(data) ? data : Array.isArray(data?.results) ? data.results : [])
            else {
                setPincodeRows([])
                ErrorToaster(data?.detail || data?.error || "Failed to load pincodes for this service centre")
            }
        } catch {
            setPincodeRows([])
            ErrorToaster("Failed to load pincodes for this service centre")
        } finally {
            setPincodesLoading(false)
        }
    }, [])

    useEffect(() => { loadPincodes(selectedCentre?.value) }, [selectedCentre, loadPincodes])

    // upload -> parse -> preview
    const { parseExcel, isLoading: parsing } = useExcelParser()
    const { exportToExcel, isExporting: templateExporting } = useExcelExport()
    const [parsedPincodes, setParsedPincodes] = useState([])
    const [mode, setMode] = useState("add") // "add" | "replace"
    const [region, setRegion] = useState("")
    const [stateCode, setStateCode] = useState("")

    const downloadTemplate = () => exportToExcel([{ pincode: "" }], "Service_Centre_Pincode_Template")

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        const result = await parseExcel(file, ["pincode"], { titleCell: "A1", dataStartRow: 1, caseSensitiveHeaders: false })
        e.target.value = ""
        if (result?.message) {
            ErrorToaster(result.message)
            return
        }
        const pincodes = [...new Set((result?.data || []).map((row) => String(row?.pincode ?? "").trim()).filter(Boolean))]
        if (!pincodes.length) {
            ErrorToaster("No pincodes found in the uploaded file")
            return
        }
        setParsedPincodes(pincodes)
    }

    // assign -- bulk-assign either upserts (mode "add") or upserts + deactivates
    // everything else mapped to this centre (mode "replace")
    const [assignLoading, setAssignLoading] = useState(false)
    const [showReplaceConfirm, setShowReplaceConfirm] = useState(false)

    const submitAssign = async () => {
        setAssignLoading(true)
        try {
            const { ok, data } = await rawRequest(BULK_ASSIGN_SERVICE_CENTRE_PINCODES, {
                method: "POST",
                body: {
                    service_center: selectedCentre.value,
                    pincodes: parsedPincodes,
                    mode,
                    ...(region.trim() ? { region: region.trim() } : {}),
                    ...(stateCode.trim() ? { state: stateCode.trim() } : {}),
                },
            })
            if (ok) {
                SucceesToaster(data?.msg || `${parsedPincodes.length} pincode(s) ${mode === "replace" ? "replaced" : "assigned"} for ${selectedCentre.label}`)
                setParsedPincodes([])
                loadPincodes(selectedCentre.value)
            } else {
                ErrorToaster(data?.detail || data?.error || data?.msg || "Failed to assign pincodes")
            }
        } catch {
            ErrorToaster("Failed to assign pincodes")
        } finally {
            setAssignLoading(false)
            setShowReplaceConfirm(false)
        }
    }

    const handleAssignClick = () => {
        if (!selectedCentre) { ErrorToaster("Select a service centre first"); return }
        if (!parsedPincodes.length) { ErrorToaster("Upload a pincode file first"); return }
        if (mode === "replace") { setShowReplaceConfirm(true); return }
        submitAssign()
    }

    const pincodeColumns = useMemo(() => [
        { header: "Pincode", accessorKey: "pincode", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "Region", accessorKey: "region", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        { header: "State", accessorKey: "state", enableSorting: true, cell: ({ getValue }) => getValue() || "—" },
        {
            header: "Status", accessorKey: "active", enableSorting: true,
            cell: ({ getValue }) => <Badge color={getValue() ? "success" : "secondary"} pill>{getValue() ? "Active" : "Inactive"}</Badge>,
        },
    ], [])

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Service Centre Pincodes"
                subTitle="Assign or replace the pincodes served by a service centre."
                extraFields={
                    <div className="flex items-center gap-2">
                        <Button
                            className="table-action-btn table-action-btn-ghost"
                            onClick={() => navigate("/service-centres")}
                        >
                            <ArrowLeft aria-hidden="true" size={15} />
                            Back to List
                        </Button>
                        <Button onClick={downloadTemplate} className="table-action-btn table-action-btn-solid">
                            {templateExporting ? <span>Exporting...</span> : <span>Template</span>}
                            <FaFileExcel size={14} aria-hidden="true" />
                        </Button>
                    </div>
                }
            />

            <div className="page-fit-body relative z-10 pb-4">
                <div className="flex flex-wrap items-end gap-4 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-72">
                        <Label className="form-label m-0 font-bold text-ink-muted">Service Centre</Label>
                        <Select
                            options={centreOptions}
                            value={selectedCentre}
                            onChange={setSelectedCentre}
                            placeholder="Select Service Centre"
                            styles={customStyles}
                            isLoading={centresLoading}
                            isClearable
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label className="form-label m-0 font-bold text-ink-muted">Mode</Label>
                        <div className="flex h-9 items-center gap-4">
                            <label className="flex items-center gap-1.5 text-sm text-ink">
                                <Input type="radio" name="pincode-mode" checked={mode === "add"} onChange={() => setMode("add")} />
                                Add
                            </label>
                            <label className="flex items-center gap-1.5 text-sm text-ink">
                                <Input type="radio" name="pincode-mode" checked={mode === "replace"} onChange={() => setMode("replace")} />
                                Replace
                            </label>
                        </div>
                    </div>

                    <div className="flex flex-col gap-1.5 sm:w-40">
                        <Label className="form-label m-0 font-bold text-ink-muted">Region</Label>
                        <Input value={region} onChange={(e) => setRegion(e.target.value)} placeholder="Optional" />
                    </div>

                    <div className="flex flex-col gap-1.5 sm:w-40">
                        <Label className="form-label m-0 font-bold text-ink-muted">State</Label>
                        <Input value={stateCode} onChange={(e) => setStateCode(e.target.value)} placeholder="Optional" />
                    </div>

                    <div className="flex w-full flex-col gap-1.5 sm:w-64">
                        <Label className="form-label m-0 font-bold text-ink-muted">Upload File</Label>
                        <Input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileChange} />
                    </div>

                    {parsing && <Spinner size="sm">loading...</Spinner>}
                </div>

                <p className="mt-2 text-xs text-ink-muted">
                    <strong className="text-ink">Add</strong> only upserts the uploaded pincodes and leaves every other pincode already mapped to this centre untouched.{" "}
                    <strong className="text-ink">Replace</strong> also deactivates any pincode currently mapped to this centre that is not in the uploaded file.
                </p>

                {parsedPincodes.length > 0 && (
                    <div className="mt-3 rounded-md border border-white/8 p-3">
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="text-sm font-semibold text-ink">
                                {parsedPincodes.length} pincode(s) ready to {mode === "replace" ? "replace" : "assign"}
                            </span>
                            <div className="flex gap-2">
                                <Button color="secondary" size="sm" onClick={() => setParsedPincodes([])}>Clear</Button>
                                <Button color="primary" size="sm" onClick={handleAssignClick} disabled={assignLoading}>
                                    {assignLoading ? "Assigning..." : "Assign Pincodes"}
                                </Button>
                            </div>
                        </div>
                        <div className="flex max-h-[160px] flex-wrap gap-2 overflow-y-auto">
                            {parsedPincodes.map((code) => (
                                <span key={code} className="badge bg-canvas text-ink border px-2 py-1" style={{ fontSize: "0.85rem" }}>{code}</span>
                            ))}
                        </div>
                    </div>
                )}

                <div className="page-fit-body mt-4">
                    {!selectedCentre ? (
                        <p className="text-ink-muted">Select a service centre to view its assigned pincodes.</p>
                    ) : pincodesLoading ? (
                        <Loader message="Loading Pincodes…" fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={pincodeColumns}
                            data={pincodeRows}
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
                            tableHeight="55vh"
                        />
                    )}
                </div>
            </div>

            <SimpleModal
                isOpen={showReplaceConfirm}
                setIsOpen={setShowReplaceConfirm}
                onCancel={() => setShowReplaceConfirm(false)}
                successButtonName={assignLoading ? "Replacing..." : "Replace"}
                onSuccess={submitAssign}
            >
                <p className="font-semibold text-danger-500">
                    Replace mode will deactivate every pincode currently mapped to{" "}
                    {selectedCentre?.label} that is not in this upload. Continue?
                </p>
            </SimpleModal>
        </div>
    )
}

export default ServiceCentrePincodes
