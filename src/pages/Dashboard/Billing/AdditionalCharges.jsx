import { useEffect, useMemo, useState } from "react";
import { Button, Label, Modal, ModalHeader, ModalBody, ModalFooter } from "@/components/ui";
import Select from "react-select";
import DateRangeInput from "../../../components/Common/DateRangeInput";
import TableContainer from "../../../components/Table/TableContainer";
import MainHeaderComp from "../../../components/MainHeaderCom";
import Loader from "@/Loaders/Loader";
import ToasterProvider from "../../../helpers/ToasterProvider";
import { customStyles } from "../../../helpers/CustomStyle";
import { authFetch } from "@/lib/http";
import { useCustomers } from "../../../hooks/queries/useReferenceData";
import { ADDITIONAL_CHARGES_LIST } from "../../../api";

const TYPE_OPTIONS = [
    { value: "", label: "All" },
    { value: "MANUAL", label: "Manual" },
    { value: "LATE", label: "Late" },
];
const PAGE_SIZE = 50;

const toYMD = (d) => {
    if (!d) return "";
    const date = new Date(d);
    if (isNaN(date.getTime())) return "";
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const formatAmount = (v) => (v == null ? "--" : Number(v).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));

const AdditionalCharges = () => {
    const { ErrorToaster } = ToasterProvider();

    const [awb, setAwb] = useState("");
    // Customer list is cached app-wide; option value is the full customer name the API expects
    const { data: customerOptions = [], isLoading: customersLoading } = useCustomers();
    const [customer, setCustomer] = useState(null);
    const [type, setType] = useState(TYPE_OPTIONS[0]);
    const [range, setRange] = useState({ startDate: "", endDate: "" });
    const [page, setPage] = useState(1);

    const [rows, setRows] = useState([]);
    const [meta, setMeta] = useState({ count: 0, total_amount: 0 });
    const [loading, setLoading] = useState(false);

    // Filters are applied only on Search, not on every keystroke; paging reuses the applied set
    const [applied, setApplied] = useState({});

    const load = async (filters, pageNo, size) => {
        const params = new URLSearchParams({ page: String(pageNo), page_size: String(size) });
        if (filters.awb) params.set("awb_number", filters.awb);
        if (filters.customer) params.set("customer_name", filters.customer);
        if (filters.type) params.set("type", filters.type);
        if (filters.from) params.set("date_from", filters.from);
        if (filters.to) params.set("date_to", filters.to);

        try {
            setLoading(true);
            const response = await authFetch(`${ADDITIONAL_CHARGES_LIST}?${params.toString()}`);
            if (response.status === 403) {
                ErrorToaster("You don't have access to this report");
                setRows([]);
                return;
            }
            const body = await response.json().catch(() => ({}));
            if (!response.ok) {
                ErrorToaster(body?.message || body?.msg || body?.detail || "Failed to load charges");
                return;
            }
            setRows(body?.results || []);
            setMeta({ count: body?.count ?? 0, total_amount: body?.total_amount ?? 0 });
        } catch (e) {
            console.error("Load additional charges failed:", e);
            ErrorToaster("Failed to load charges");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load(applied, page, PAGE_SIZE);
    }, [applied, page]);

    const onSearch = () => {
        setPage(1);
        setApplied({
            awb: awb.trim(),
            customer: customer?.value || "",
            type: type?.value || "",
            from: toYMD(range.startDate),
            to: toYMD(range.endDate),
        });
    };

    const onReset = () => {
        setAwb("");
        setCustomer(null);
        setType(TYPE_OPTIONS[0]);
        setRange({ startDate: "", endDate: "" });
        setPage(1);
        setApplied({});
    };

    // Row shown in the details popup
    const [selected, setSelected] = useState(null);
    const detailFields = selected
        ? [
            ["Type", selected.type],
            ["AWB No.", selected.awb_number],
            ["Charge Name", selected.charge_name],
            ["Amount", selected.amount != null ? `₹ ${formatAmount(selected.amount)}` : null],
            ["Customer", selected.customer_name],
            ["Service Center", selected.service_center],
            ["Employee", selected.employee_name],
            ["Employee Code", selected.employee_code],
            ["Created At", selected.created_at ? String(selected.created_at).replace("T", " ").split(".")[0] : null],
            ["Bill Status", selected.bill_status],
            ["Invoice No.", selected.invoice_number],
            ["Remarks", selected.remarks],
        ].map(([label, value]) => [label, value === null || value === undefined || value === "" ? "--" : value])
        : [];

    const totalPages = Math.max(1, Math.ceil(meta.count / PAGE_SIZE));

    const columns = useMemo(
        () => [
            { header: "Type", accessorKey: "type", enableColumnFilter: false, cell: ({ getValue }) => getValue() ?? "--" },
            { header: "AWB No.", accessorKey: "awb_number", enableColumnFilter: false, cell: ({ getValue }) => getValue() ?? "--" },
            { header: "Charge Name", accessorKey: "charge_name", enableColumnFilter: false, cell: ({ getValue }) => getValue() ?? "--" },
            { header: "Amount", accessorKey: "amount", enableColumnFilter: false, cell: ({ getValue }) => formatAmount(getValue()) },
            { header: "Remarks", accessorKey: "remarks", enableColumnFilter: false, cell: ({ getValue }) => getValue() || "--" },
            { header: "Service Center", accessorKey: "service_center", enableColumnFilter: false, cell: ({ getValue }) => getValue() ?? "--" },
            {
                header: "Employee",
                accessorKey: "employee_name",
                enableColumnFilter: false,
                cell: ({ row }) =>
                    row.original.employee_name
                        ? `${row.original.employee_name}${row.original.employee_code ? ` (${row.original.employee_code})` : ""}`
                        : "--",
            },
            { header: "Customer", accessorKey: "customer_name", enableColumnFilter: false, cell: ({ getValue }) => getValue() ?? "--" },
            {
                header: "Created At",
                accessorKey: "created_at",
                enableColumnFilter: false,
                cell: ({ getValue }) => (getValue() ? String(getValue()).replace("T", " ").split(".")[0] : "--"),
            },
            { header: "Bill Status", accessorKey: "bill_status", enableColumnFilter: false, cell: ({ getValue }) => getValue() ?? "--" },
            { header: "Invoice No.", accessorKey: "invoice_number", enableColumnFilter: false, cell: ({ getValue }) => getValue() ?? "--" },
        ],
        []
    );

    return (
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp title="Additional Charges" />

            <div className="page-fit-body relative z-10 pb-4">
                <div className="flex flex-wrap items-end gap-3 border-b border-white/8 pb-4">
                    <div className="flex w-full flex-col gap-1.5 sm:w-48">
                        <Label className="form-label m-0 font-bold text-ink-muted">AWB No.</Label>
                        <input
                            className="form-control"
                            value={awb}
                            onChange={(e) => setAwb(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && onSearch()}
                            placeholder="e.g. VIN0012345"
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1.5 sm:w-56">
                        <Label className="form-label m-0 font-bold text-ink-muted">Customer Name</Label>
                        <Select
                            options={customerOptions}
                            value={customer}
                            onChange={setCustomer}
                            isLoading={customersLoading}
                            isClearable
                            placeholder="All Customers"
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1.5 sm:w-36">
                        <Label className="form-label m-0 font-bold text-ink-muted">Type</Label>
                        <Select
                            options={TYPE_OPTIONS}
                            value={type}
                            onChange={setType}
                            styles={customStyles}
                            menuPortalTarget={document.body}
                            menuPosition="fixed"
                        />
                    </div>
                    <div className="flex w-full flex-col gap-1.5 sm:w-60">
                        <Label className="form-label m-0 font-bold text-ink-muted">Date Range</Label>
                        <DateRangeInput value={range} onChange={setRange} isBorder={true} />
                    </div>
                    <Button color="primary" className="h-9.5 shrink-0 px-6" onClick={onSearch} disabled={loading}>
                        Search
                    </Button>
                    <Button color="secondary" className="h-9.5 shrink-0 px-6" onClick={onReset} disabled={loading}>
                        Reset
                    </Button>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
                    <div className="text-ink-muted">
                        <span className="font-bold text-ink">{meta.count}</span> charges · Total{" "}
                        <span className="font-bold text-ink">₹ {formatAmount(meta.total_amount)}</span>
                    </div>
                </div>

                <div className="page-fit-body mt-3">
                    {loading ? (
                        <Loader message="Loading Charges ..." fullscreen={false} />
                    ) : (
                        <TableContainer
                            columns={columns}
                            data={rows}
                            handleUserClick={setSelected}
                            isGlobalFilter={false}
                            isPagination={false}
                            tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                            theadClass="sticky top-0 z-10"
                            isStickyHeader={true}
                            stickyTop={0}
                            fillHeight
                            tableHeight="62vh"
                        />
                    )}
                </div>

                {/* Pagination below the table; page size is fixed at PAGE_SIZE */}
                <div className="mt-3 flex items-center justify-end gap-2 text-sm">
                    <Button color="secondary" disabled={page <= 1 || loading} onClick={() => setPage((p) => p - 1)}>
                        Prev
                    </Button>
                    <span className="text-ink-muted">Page {page} of {totalPages}</span>
                    <Button color="secondary" disabled={page >= totalPages || loading} onClick={() => setPage((p) => p + 1)}>
                        Next
                    </Button>
                </div>
            </div>

            <Modal isOpen={!!selected} toggle={() => setSelected(null)} centered>
                <ModalHeader toggle={() => setSelected(null)}>Charge Details</ModalHeader>
                <ModalBody>
                    <div className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                        {detailFields.map(([label, value]) => (
                            <div key={label}>
                                <div className="text-xs font-bold text-ink-muted">{label}</div>
                                <div className="wrap-break-word text-ink">{value}</div>
                            </div>
                        ))}
                    </div>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" onClick={() => setSelected(null)}>Close</Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default AdditionalCharges;
