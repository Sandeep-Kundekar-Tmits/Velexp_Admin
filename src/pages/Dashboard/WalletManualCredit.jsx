// Wallet Manual Credit -- an ops/finance admin crediting a customer's wallet
// directly (e.g. reconciling an offline NEFT/UTR payment against their
// account), plus the history of past manual credits for that customer.
//
// Both endpoints are plain DRF REST (/api/admin-panel/), so this calls
// rawRequest directly rather than the generic use*ApiCall hooks -- same
// reasoning as RiderStoreRoutes.jsx/PincodeMaster*/DomesticMisReport.jsx.
// The GET /manual-credits/ response shape wasn't documented beyond the
// request, so the history table's columns are built dynamically from
// whatever keys the response actually returns (same approach as
// DomesticMisReport.jsx and the Mobile App Report fix).
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import AsyncSelect from "react-select/async"
import { Button, FormGroup, Input, Label } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../helpers/CustomStyle"
import TableContainer from "../../components/Table/TableContainer"
import SimpleModal from "../../components/SimpleModal"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../helpers/ToasterProvider"
import { isIsoDateLike, formatDisplayDate } from "../../helpers/formatDisplayDate"
import { DOMESTIC_MIS_CUSTOMERS, WALLET_MANUAL_CREDITS, WALLET_MANUAL_CREDIT_CREATE } from "../../api"

const humanize = (key) => key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())

const unwrapRows = (res) => {
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.results)) return res.results
    return []
}

const formatCell = (value) => {
    if (value === null || value === undefined || value === "") return "-"
    if (isIsoDateLike(value)) return formatDisplayDate(value)
    if (typeof value === "number") return value.toLocaleString("en-IN")
    return String(value)
}

const EMPTY_FORM = { amount: "", reference: "", remarks: "" }

const WalletManualCredit = () => {
    useEffect(() => { document.title = "Wallet Manual Credit" }, [])

    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [rows, setRows] = useState([])
    const [loading, setLoading] = useState(false)
    const [hasLoaded, setHasLoaded] = useState(false)

    const customerSearchTimeout = useRef(null)
    const loadCustomerOptions = useCallback((inputValue, callback) => {
        if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current)
        customerSearchTimeout.current = setTimeout(async () => {
            const { ok, data } = await rawRequest(`${DOMESTIC_MIS_CUSTOMERS}?search=${encodeURIComponent(inputValue)}`, { method: "GET" })
            const list = ok ? (Array.isArray(data) ? data : data?.results || []) : []
            callback(list.map((c) => ({ value: c.user_id, label: c.customer_name })))
        }, 400)
    }, [])

    const loadHistory = useCallback(async (userId) => {
        if (!userId) { setRows([]); setHasLoaded(false); return }
        setLoading(true)
        setHasLoaded(true)
        try {
            const { ok, data } = await rawRequest(`${WALLET_MANUAL_CREDITS}?user_id=${userId}&limit=50`, { method: "GET" })
            if (ok) {
                setRows(unwrapRows(data))
            } else {
                setRows([])
                ErrorToaster(data?.detail || data?.error || data?.message || "Failed to load credit history")
            }
        } catch {
            setRows([])
            ErrorToaster("Failed to load credit history — network error")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { loadHistory(selectedCustomer?.value) }, [selectedCustomer, loadHistory])

    // add-credit modal
    const [formOpen, setFormOpen] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    const openForm = () => { setForm(EMPTY_FORM); setFormOpen(true) }

    const handleSave = async () => {
        const amount = Number(form.amount)
        if (!amount || amount <= 0) { ErrorToaster("Enter a valid amount"); return }
        if (!form.reference.trim()) { ErrorToaster("Reference is required"); return }

        setSaving(true)
        try {
            const { ok, data } = await rawRequest(WALLET_MANUAL_CREDIT_CREATE, {
                method: "POST",
                body: {
                    user_id: selectedCustomer.value,
                    amount,
                    reference: form.reference.trim(),
                    remarks: form.remarks.trim(),
                },
            })
            if (ok) {
                SucceesToaster(`Credited ₹${amount.toLocaleString("en-IN")} to ${selectedCustomer.label}`)
                setFormOpen(false)
                loadHistory(selectedCustomer.value)
            } else {
                ErrorToaster(data?.detail || data?.error || data?.message || "Failed to add credit")
            }
        } catch {
            ErrorToaster("Failed to add credit — network error")
        } finally {
            setSaving(false)
        }
    }

    const columns = useMemo(() => {
        if (!rows.length) return []
        return Object.keys(rows[0]).map((key) => ({
            header: humanize(key),
            accessorKey: key,
            enableSorting: true,
            cell: ({ getValue }) => formatCell(getValue()),
        }))
    }, [rows])

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Wallet Manual Credit"
                subTitle="Credit a customer's wallet for an offline payment, and review past manual credits."
                extraFields={
                    selectedCustomer && (
                        <Button color="primary" onClick={openForm}>+ Add Credit</Button>
                    )
                }
            />

            <div className="page-fit-body relative z-10 pb-4">
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-80">
                        <Label className="form-label m-0 font-bold text-ink-muted">Customer</Label>
                        <AsyncSelect
                            cacheOptions
                            defaultOptions
                            loadOptions={loadCustomerOptions}
                            value={selectedCustomer}
                            onChange={setSelectedCustomer}
                            placeholder="Search customer by name"
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            isClearable
                        />
                    </div>
                </div>

                <div className="page-fit-body mt-4">
                    {!selectedCustomer ? (
                        <p className="text-ink-muted py-6 text-center text-xs">Select a customer to view their wallet credit history</p>
                    ) : loading ? (
                        <Loader message="Loading credit history…" fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={columns}
                            data={rows}
                            isGlobalFilter={true}
                            isPagination={true}
                            isCustomPageSize={true}
                            defaultPageSize={20}
                            SearchPlaceholder="Search within results..."
                            pagination="pagination"
                            paginationWrapper="dataTables_paginate paging_simple_numbers"
                            tableClass="table-nowrap"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="68vh"
                        />
                    )}
                    {hasLoaded && !loading && rows.length === 0 && (
                        <p className="text-ink-muted py-6 text-center text-xs">No manual credits found for this customer</p>
                    )}
                </div>
            </div>

            <SimpleModal
                isOpen={formOpen}
                setIsOpen={setFormOpen}
                successButtonName={saving ? "Crediting…" : `Credit ₹${Number(form.amount || 0).toLocaleString("en-IN")}`}
                onSuccess={handleSave}
                onCancel={() => setFormOpen(false)}
            >
                <h5 className="mb-4">Add Wallet Credit — {selectedCustomer?.label}</h5>
                <FormGroup>
                    <Label>Amount (₹) *</Label>
                    <Input
                        type="number"
                        min="1"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        placeholder="5000"
                    />
                </FormGroup>
                <FormGroup>
                    <Label>Reference *</Label>
                    <Input
                        value={form.reference}
                        onChange={(e) => setForm({ ...form, reference: e.target.value })}
                        placeholder="UTR / transaction number"
                    />
                </FormGroup>
                <FormGroup>
                    <Label>Remarks</Label>
                    <Input
                        type="textarea"
                        value={form.remarks}
                        onChange={(e) => setForm({ ...form, remarks: e.target.value })}
                        placeholder="e.g. NEFT from HDFC 06-Oct"
                    />
                </FormGroup>
                {saving && <div className="text-xs text-ink-muted">Saving…</div>}
            </SimpleModal>
        </div>
    )
}

export default WalletManualCredit
