// Wallet -- a customer's full wallet transaction ledger, plus the ability
// for an ops/finance admin to manually credit it (e.g. reconciling an
// offline NEFT/UTR payment) and review past manual credits specifically.
//
// All three endpoints are plain DRF REST (/api/admin-panel/), so this calls
// rawRequest directly rather than the generic use*ApiCall hooks -- same
// reasoning as RiderStoreRoutes.jsx/PincodeMaster*/DomesticMisReport.jsx.
// Both /transactions/ and /manual-credits/ return the same row shape
// (confirmed live: id, user_id, customer, amount, reference, remarks,
// balance_after, added_by_id, added_by, created, transaction_type, status,
// method, payment_id) -- manual-credits is simply a filtered view of the
// same ledger, so both tables share TRANSACTION_COLUMNS. /transactions/
// additionally returns current_balance/total_credited alongside the rows.
import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import AsyncSelect from "react-select/async"
import { Badge, Button, FormGroup, Input, Label, Nav, NavItem, NavLink, TabContent, TabPane } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { customStyles } from "../../helpers/CustomStyle"
import DateRangeInput from "../../components/Common/DateRangeInput"
import TableContainer from "../../components/Table/TableContainer"
import SimpleModal from "../../components/SimpleModal"
import MainHeaderComp from "../../components/MainHeaderCom"
import Loader from "@/Loaders/Loader"
import ToasterProvider from "../../helpers/ToasterProvider"
import { formatDisplayDate } from "../../helpers/formatDisplayDate"
import YMD_DateFormate from "../../helpers/YMD_DateFormate"
import {
    DOMESTIC_MIS_CUSTOMERS,
    WALLET_MANUAL_CREDITS,
    WALLET_MANUAL_CREDIT_CREATE,
    WALLET_TRANSACTIONS,
} from "../../api"

const unwrapRows = (res) => {
    if (Array.isArray(res)) return res
    if (Array.isArray(res?.data)) return res.data
    if (Array.isArray(res?.results)) return res.results
    return []
}

const orDash = (v) => (v === null || v === undefined || v === "" ? "-" : v)
const fmtCurrency = (v) =>
    v === null || v === undefined ? "-" : `₹${Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const TRANSACTION_COLUMNS = [
    { header: "Date", accessorKey: "created", enableSorting: true, cell: ({ getValue }) => formatDisplayDate(getValue()) },
    { header: "Amount", accessorKey: "amount", enableSorting: true, cell: ({ getValue }) => fmtCurrency(getValue()) },
    {
        header: "Type", accessorKey: "transaction_type", enableSorting: true,
        cell: ({ getValue }) => <Badge color="info">{orDash(getValue())}</Badge>,
    },
    {
        header: "Status", accessorKey: "status", enableSorting: true,
        cell: ({ getValue }) => <Badge color={getValue() === "Success" ? "success" : "secondary"}>{orDash(getValue())}</Badge>,
    },
    { header: "Method", accessorKey: "method", cell: ({ getValue }) => orDash(getValue()) },
    { header: "Reference", accessorKey: "reference", cell: ({ getValue }) => orDash(getValue()) },
    { header: "Remarks", accessorKey: "remarks", cell: ({ getValue }) => orDash(getValue()) },
    { header: "Balance After", accessorKey: "balance_after", enableSorting: true, cell: ({ getValue }) => fmtCurrency(getValue()) },
    { header: "Added By", accessorKey: "added_by", cell: ({ getValue }) => orDash(getValue()) },
]

const StatBadge = ({ label, value, color = "primary" }) => (
    <div className="inline-flex min-w-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/3 px-2.5 py-1">
        <span className="text-[11px] uppercase tracking-wider text-ink-muted">{label}</span>
        <Badge color={color}>{value ?? "—"}</Badge>
    </div>
)

const EMPTY_FORM = { amount: "", reference: "", remarks: "" }
const TABS = [
    { key: "transactions", label: "Transactions" },
    { key: "manual-credits", label: "Manual Credits" },
]

const WalletManualCredit = () => {
    useEffect(() => { document.title = "Wallet" }, [])

    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [activeTab, setActiveTab] = useState(TABS[0].key)

    const customerSearchTimeout = useRef(null)
    const loadCustomerOptions = useCallback((inputValue, callback) => {
        if (customerSearchTimeout.current) clearTimeout(customerSearchTimeout.current)
        customerSearchTimeout.current = setTimeout(async () => {
            const { ok, data } = await rawRequest(`${DOMESTIC_MIS_CUSTOMERS}?search=${encodeURIComponent(inputValue)}`, { method: "GET" })
            const list = ok ? (Array.isArray(data) ? data : data?.results || []) : []
            callback(list.map((c) => ({ value: c.user_id, label: c.customer_name })))
        }, 400)
    }, [])

    // ── All transactions (full ledger), date-range scoped ─────────────────
    const [txnRange, setTxnRange] = useState({ startDate: null, endDate: null })
    const [txnRows, setTxnRows] = useState([])
    const [txnBalance, setTxnBalance] = useState(null)
    const [txnLoading, setTxnLoading] = useState(false)
    const [txnLoaded, setTxnLoaded] = useState(false)

    useEffect(() => {
        const today = new Date()
        const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
        setTxnRange({ startDate: firstDay, endDate: today })
    }, [])

    const loadTransactions = useCallback(async () => {
        if (!selectedCustomer || !txnRange.startDate || !txnRange.endDate) return
        setTxnLoading(true)
        setTxnLoaded(true)
        try {
            const { from_date, to_date } = YMD_DateFormate(txnRange)
            const { ok, data } = await rawRequest(
                `${WALLET_TRANSACTIONS}?user_id=${selectedCustomer.value}&start_date=${from_date}&end_date=${to_date}`,
                { method: "GET" }
            )
            if (ok) {
                setTxnRows(unwrapRows(data))
                setTxnBalance({ current: data?.current_balance, totalCredited: data?.total_credited })
            } else {
                setTxnRows([])
                setTxnBalance(null)
                ErrorToaster(data?.detail || data?.error || data?.message || "Failed to load transactions")
            }
        } catch {
            setTxnRows([])
            setTxnBalance(null)
            ErrorToaster("Failed to load transactions — network error")
        } finally {
            setTxnLoading(false)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCustomer, txnRange])

    // Auto-load on customer change (default date range already set); the
    // "Search" button re-runs it after the user picks a different range.
    useEffect(() => {
        if (selectedCustomer) loadTransactions()
        else { setTxnRows([]); setTxnLoaded(false) }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedCustomer])

    // ── Manual credits (subset: only the manually-added ones) ─────────────
    const [creditRows, setCreditRows] = useState([])
    const [creditLoading, setCreditLoading] = useState(false)
    const [creditLoaded, setCreditLoaded] = useState(false)

    const loadCreditHistory = useCallback(async (userId) => {
        if (!userId) { setCreditRows([]); setCreditLoaded(false); return }
        setCreditLoading(true)
        setCreditLoaded(true)
        try {
            const { ok, data } = await rawRequest(`${WALLET_MANUAL_CREDITS}?user_id=${userId}&limit=50`, { method: "GET" })
            if (ok) {
                setCreditRows(unwrapRows(data))
            } else {
                setCreditRows([])
                ErrorToaster(data?.detail || data?.error || data?.message || "Failed to load credit history")
            }
        } catch {
            setCreditRows([])
            ErrorToaster("Failed to load credit history — network error")
        } finally {
            setCreditLoading(false)
        }
    }, [])

    useEffect(() => { loadCreditHistory(selectedCustomer?.value) }, [selectedCustomer, loadCreditHistory])

    // ── Add-credit modal ────────────────────────────────────────────────
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
                loadCreditHistory(selectedCustomer.value)
                loadTransactions()
            } else {
                ErrorToaster(data?.detail || data?.error || data?.message || "Failed to add credit")
            }
        } catch {
            ErrorToaster("Failed to add credit — network error")
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="Wallet"
                subTitle="A customer's full wallet transaction history, plus manual credits for offline payments."
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

                {!selectedCustomer ? (
                    <p className="text-ink-muted py-6 text-center text-xs">Select a customer to view their wallet</p>
                ) : (
                    <>
                        <Nav tabs className="nav-tabs-custom nav-justified mt-3">
                            {TABS.map((tab) => (
                                <NavItem key={tab.key}>
                                    <NavLink
                                        active={activeTab === tab.key}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => setActiveTab(tab.key)}
                                        className={activeTab === tab.key ? "bg-[#3B82F6]/12 text-[15px] font-bold" : "text-[15px] font-bold"}
                                    >
                                        {tab.label}
                                    </NavLink>
                                </NavItem>
                            ))}
                        </Nav>

                        <TabContent activeTab={activeTab} className="page-fit-body mt-3">
                            <TabPane tabId="transactions" className="page-fit-body">
                                {activeTab === "transactions" && (
                                    <div className="page-fit-body">
                                        <div className="flex flex-wrap items-end gap-3 mb-3">
                                            <div className="flex w-full flex-col gap-1.5 sm:w-72">
                                                <Label className="form-label m-0 font-bold text-ink-muted">Date Range</Label>
                                                <DateRangeInput value={txnRange} onChange={setTxnRange} isBorder={true} />
                                            </div>
                                            <Button color="secondary" onClick={loadTransactions} disabled={txnLoading}>
                                                {txnLoading ? "Loading..." : "Search"}
                                            </Button>
                                        </div>

                                        {txnBalance && (
                                            <div className="mb-3 flex flex-wrap items-center gap-2">
                                                <StatBadge label="Current Balance" value={fmtCurrency(txnBalance.current)} color="success" />
                                                <StatBadge label="Total Credited (this range)" value={fmtCurrency(txnBalance.totalCredited)} color="primary" />
                                            </div>
                                        )}

                                        {txnLoading ? (
                                            <Loader message="Loading transactions…" fullscreen={false} />
                                        ) : (
                                            <TableContainer
                                                columns={TRANSACTION_COLUMNS}
                                                data={txnRows}
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
                                                tableHeight="60vh"
                                            />
                                        )}
                                        {txnLoaded && !txnLoading && txnRows.length === 0 && (
                                            <p className="text-ink-muted py-6 text-center text-xs">No transactions found for this date range</p>
                                        )}
                                    </div>
                                )}
                            </TabPane>

                            <TabPane tabId="manual-credits" className="page-fit-body">
                                {activeTab === "manual-credits" && (
                                    <div className="page-fit-body">
                                        {creditLoading ? (
                                            <Loader message="Loading credit history…" fullscreen={false} />
                                        ) : (
                                            <TableContainer
                                                columns={TRANSACTION_COLUMNS}
                                                data={creditRows}
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
                                                tableHeight="60vh"
                                            />
                                        )}
                                        {creditLoaded && !creditLoading && creditRows.length === 0 && (
                                            <p className="text-ink-muted py-6 text-center text-xs">No manual credits found for this customer</p>
                                        )}
                                    </div>
                                )}
                            </TabPane>
                        </TabContent>
                    </>
                )}
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
