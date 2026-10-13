import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui";
import { useNavigate } from "react-router-dom";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GET_ALL_USER_LIST, GET_USER_API } from "../../api";
import usePostApiCall from "../../hooks/usePostApiCall";
import Loader from "../../Loaders/Loader";
import { motion } from "framer-motion";
import { Building2, Copy, Eye, Handshake, Pencil, Store, UserPlus, Users } from "lucide-react";
import MainHeaderCom from "../../components/MainHeaderCom";
import Customer360Modal from "../../components/UserManagement/Customer360Modal";
import { cn } from "@/lib/cn";
import ToasterProvider from "../../helpers/ToasterProvider";
import SimpleModal from "../../components/SimpleModal";
import { FormGroup, Input, Label } from "@/components/ui";

/* Rows are quoted or left blank in the same shape account/ops teams already
   paste into their own tickets. Password and Service Type have no backing
   field on this record at all -- `fromRow` is omitted for both, so the Copy
   modal always opens with those two blank and editable, letting whoever is
   copying fill in the one piece this record doesn't carry before copying.
   `label` is padded to a fixed column so every colon lines up regardless of
   how long the label text is. */
const COPY_FIELDS = [
    { label: "Username", fromRow: (row) => row.username },
    { label: "Password" },
    { label: "Secret Code", fromRow: (row) => row.domestic_secretcode },
    { label: "Customer Name", fromRow: (row) => row.customer_name },
    { label: "Account Number", fromRow: (row) => row.accno },
    { label: "Service Type" },
];
const LABEL_WIDTH = 18;

const buildCopyText = (row, manualValues) => COPY_FIELDS.map(({ label, fromRow }) => {
    const v = fromRow ? fromRow(row) : (manualValues[label] || "").trim();
    return `${label.padEnd(LABEL_WIDTH)}:${v ? ` '${v}'` : ""}`;
}).join("\n");

/* navigator.clipboard.writeText silently rejects outside a secure context
   (plain http, which is how this admin panel is reached on the LAN) --
   execCommand("copy") via a throwaway textarea has no such restriction, so
   it's the fallback rather than the primary path's error case. */
const copyToClipboard = async (text) => {
    if (navigator.clipboard && window.isSecureContext) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch {
            // fall through to the execCommand fallback below
        }
    }
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    let ok = false;
    try {
        ok = document.execCommand("copy");
    } catch {
        ok = false;
    }
    document.body.removeChild(textarea);
    return ok;
};

const EASE = [0.22, 1, 0.36, 1];

const cardVariants = {
    hidden: { opacity: 0, y: 14 },
    show: (i) => ({
        opacity: 1,
        y: 0,
        transition: { duration: 0.3, ease: EASE, delay: 0.04 * i },
    }),
};

/* Stat tiles. `accent` drives icon colour and glow only -- never text on a
   fill, so contrast never depends on it. */
const STAT_ACCENTS = {
    blue: "text-[#3B82F6] shadow-[0_0_30px_-10px_rgba(59,130,246,0.8)]",
    purple: "text-[#8B5CF6] shadow-[0_0_30px_-10px_rgba(139,92,246,0.8)]",
    cyan: "text-[#38BDF8] shadow-[0_0_30px_-10px_rgba(56,189,248,0.8)]",
    green: "text-[#22C55E] shadow-[0_0_30px_-10px_rgba(34,197,94,0.8)]",
};

const UserManagementList = () => {
    // Document title effect
    useEffect(() => {
        document.title = "User Management";
    }, []);

    const navigate = useNavigate();
    const { apifunc: getUser, data, loading } = usePostApiCall();
    const { SucceesToaster, ErrorToaster } = ToasterProvider();
    /* Customer name of the row whose 360 view is open; null when closed.
       The name, not the row id -- customer-360 keys on it, and one customer
       can hold several accounts. */
    const [detailCustomer, setDetailCustomer] = useState(null);

    /* Row the Copy modal is open for, plus the two fields it can't fill in
       from the record itself (null when the modal is closed). */
    const [copyTarget, setCopyTarget] = useState(null);
    const [copyPassword, setCopyPassword] = useState("");
    const [copyServiceType, setCopyServiceType] = useState("");

    // Memoized navigation handlers
    const handleEdit = useCallback((rowData) => {
        navigate(`/edit-user/${rowData?.id}`);
    }, [navigate]);

    const handleView = useCallback((rowData) => {
        navigate(`/user/${rowData?.id}`);
    }, [navigate]);

    const handleAddUser = useCallback(() => {
        navigate("/add-user");
    }, [navigate]);

    const handleCopy = useCallback((rowData) => {
        setCopyTarget(rowData);
        setCopyPassword("");
        setCopyServiceType("");
    }, []);

    const copyPreview = useMemo(() => {
        if (!copyTarget) return "";
        return buildCopyText(copyTarget, { Password: copyPassword, "Service Type": copyServiceType });
    }, [copyTarget, copyPassword, copyServiceType]);

    const handleCopyConfirm = useCallback(async () => {
        const ok = await copyToClipboard(copyPreview);
        if (ok) {
            SucceesToaster("Copied to clipboard");
            setCopyTarget(null);
        } else {
            ErrorToaster("Couldn't copy automatically — select the text below and copy it manually");
        }
    }, [copyPreview, SucceesToaster, ErrorToaster]);

    /* Memoized columns configuration.
     *
     * `size` is what fixes the widths: TableContainer's cellLines prop puts the
     * table in table-layout:fixed and feeds these numbers to the header row.
     * They are proportions, not pixels -- the table is still width:100%, so
     * these divide it 120:120:200:120:130:170:100. */
    const columns = useMemo(() => [
        {
            header: 'First name',
            accessorKey: 'first_name',
            enableColumnFilter: false,
            enableSorting: true,
            size: 120,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Last name',
            accessorKey: 'last_name',
            enableColumnFilter: false,
            enableSorting: true,
            size: 120,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Email',
            accessorKey: 'email',
            enableColumnFilter: false,
            enableSorting: true,
            size: 200,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Phone',
            accessorKey: 'phone',
            enableColumnFilter: false,
            enableSorting: true,
            size: 120,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Customer Type',
            accessorKey: 'cust_type',
            enableColumnFilter: false,
            enableSorting: true,
            size: 130,
            cell: ({ row }) => {
                const type = row.original.cust_type?.type_of_cust?.trim();
                if (!type) return "--";
                return (
                    <span className="inline-flex items-center rounded-full border border-[rgb(var(--overlay-rgb)/0.1)] bg-[rgb(var(--overlay-rgb)/0.06)] px-2.5 py-0.5 text-[11px] font-medium text-ink">
                        {type}
                    </span>
                );
            },
        },
        {
            header: 'Customer name',
            accessorKey: 'customer_name',
            enableColumnFilter: false,
            enableSorting: true,
            size: 170,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Actions',
            accessorKey: 'actions',
            enableColumnFilter: false,
            enableSorting: false,
            /* Sized for its content, not squeezed with the text columns: three
               labelled buttons plus the cell padding need ~230px, which is what
               this share of the 1010 total works out to at the widths this
               screen renders at. */
            size: 230,
            cell: ({ row }) => (
                /* nowrap + shrink-0: this column holds controls, so it may
                   overflow before it lets a button break across two lines or
                   squash "View" to "Vie...". */
                <div className="flex shrink-0 items-center justify-center gap-2 whitespace-nowrap">
                    <Button
                        color="success"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleView(row.original); }}
                        aria-label={`View ${row.original?.customer_name || "customer"}`}
                        className="shrink-0 gap-1.5 rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/15 text-ink transition-all duration-200 hover:bg-[#3B82F6]/25 hover:text-ink hover:shadow-[0_0_18px_-4px_rgba(59,130,246,0.9)]"
                    >
                        <Eye aria-hidden="true" className="size-3.5" />
                        View
                    </Button>
                    <Button
                        color="primary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleEdit(row.original); }}
                        aria-label={`Edit ${row.original?.customer_name || "customer"}`}
                        className="shrink-0 gap-1.5 rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 text-ink transition-all duration-200 hover:bg-[#8B5CF6]/25 hover:text-ink hover:shadow-[0_0_18px_-4px_rgba(139,92,246,0.9)]"
                    >
                        <Pencil aria-hidden="true" className="size-3.5" />
                        Edit
                    </Button>
                    <Button
                        color="secondary"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); handleCopy(row.original); }}
                        aria-label={`Copy ${row.original?.customer_name || "customer"} details`}
                        className="shrink-0 gap-1.5 rounded-lg border border-[#38BDF8]/30 bg-[#38BDF8]/15 text-ink transition-all duration-200 hover:bg-[#38BDF8]/25 hover:text-ink hover:shadow-[0_0_18px_-4px_rgba(56,189,248,0.9)]"
                    >
                        <Copy aria-hidden="true" className="size-3.5" />
                        Copy
                    </Button>
                </div>
            ),
        },
    ], [handleEdit, handleView, handleCopy]);

    // Data fetching effect
    useEffect(() => {
        let userId = JSON.parse(localStorage.getItem("authUser"))?.user?.id
        getUser(GET_ALL_USER_LIST, {
            "user_id": userId
        });
    }, [getUser]);

    // Process data only when needed
    const processedData = useMemo(() => {
        if (!Array.isArray(data)) return [];
        return data.map(info => ({
            ...info,
            first_name: info.first_name,
            last_name: info.last_name,
            email: info.email,
            phone: info.phone,
            customer_name: info.customer_name,
        })).filter(ele => {
            return ele?.customer_name
        })
    }, [data]);

    /* Counted off the rows already on screen -- no extra request, and every
       figure is derived from real data. Deliberately no trend percentages:
       this endpoint returns no previous-period figures, so any "+12%" would be
       invented. */
    const stats = useMemo(() => {
        const countOf = (pattern) => processedData.filter((row) =>
            pattern.test(row?.cust_type?.type_of_cust?.trim() || "")
        ).length;

        return [
            { label: "Total Customers", value: processedData.length, Icon: Users, accent: "blue" },
            { label: "Corporate", value: countOf(/corporate/i), Icon: Building2, accent: "purple" },
            { label: "Franchise", value: countOf(/franchise/i), Icon: Handshake, accent: "cyan" },
            { label: "Retail", value: countOf(/retail/i), Icon: Store, accent: "green" },
        ];
    }, [processedData]);

    if (loading) {
        return (
            // flex column with a definite height, so the loader can stretch to
            // fill it and centre itself rather than hugging the top.
            <div className="relative flex h-full min-h-full flex-col">
                {/* Inline, not fixed: this replaces the page body while the
                    layout chrome around it stays interactive. Transparent, so
                    the layout's backdrop stays visible underneath. */}
                {/* bg-transparent / backdrop-blur-none / flex-1 dropped: the
                    inline loader is transparent and fills its flex parent by
                    default now, so this was undoing a default that no longer
                    exists. */}
                <Loader message="Loading customers..." fullscreen={false} className="relative z-10" />
            </div>
        )
    }

    return (
        /* No background of its own: the canvas and the route backdrop are the
           layout's job now, so every screen shares one rather than each
           painting its own over the top. */
        <div className="page-content page-fit relative min-h-full overflow-x-hidden py-0 antialiased">
            {/* No px-* here: the inline gutter comes from .page-content, which
                layout-compat sets from --sidebar-gap so it matches the rail's
                own gutter. Adding padding here would stack a second one. */}
            {/* pb-4 only: the gap above comes from the page header's own
                bottom margin, and a py-4 here would stack a second one. */}
            <div className="page-fit-body relative z-10 pb-4">
                {/* Renders nothing here -- MainHeaderCom hands all three up to
                    the layout's PageHeader. Same call the other 69 screens
                    make, so this one is no longer a special case. */}
                <MainHeaderCom
                    title="User Management"
                    subTitle="Manage corporate, franchise and retail customers."
                    extraFields={<motion.button
                        type="button"
                        onClick={handleAddUser}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#3B82F6] to-[#8B5CF6] px-4 text-[13px] font-semibold text-white shadow-[0_10px_30px_-12px_rgba(59,130,246,0.9)] transition-shadow duration-200 hover:shadow-[0_16px_40px_-12px_rgba(139,92,246,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
                    >
                        <UserPlus aria-hidden="true" className="size-4" />
                        Add User
                    </motion.button>}
                />

                {/* Tiles are read-once context, not the subject of the screen,
                    so they are sized to stay out of the grid's way: ~92px tall
                    against the old ~124px. */}
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map(({ label, value, Icon, accent }, index) => (
                        <motion.div
                            key={label}
                            custom={index}
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                            whileHover={{ y: -2 }}
                            className="group rounded-xl border border-[rgb(var(--overlay-rgb)/0.08)] bg-[var(--glass-surface)] p-3.5 backdrop-blur-xl transition-colors duration-200 hover:border-[rgb(var(--overlay-rgb)/0.16)]"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-[11px] font-medium uppercase tracking-wider text-ink-muted">
                                    {label}
                                </p>
                                <span
                                    className={cn(
                                        "flex size-8 items-center justify-center rounded-lg border border-[rgb(var(--overlay-rgb)/0.08)] bg-[rgb(var(--overlay-rgb)/0.04)] transition-shadow duration-200",
                                        STAT_ACCENTS[accent]
                                    )}
                                >
                                    <Icon aria-hidden="true" className="size-4" />
                                </span>
                            </div>
                            {/* leading-tight, or the 22px figure reserves a 32px
                                line box and gives back the padding just saved. */}
                            <p className="mt-1.5 text-[22px] font-semibold leading-tight tracking-tight text-ink">
                                {value.toLocaleString()}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE, delay: 0.2 }}
                    /* The panel, the grid skin and the toolbar/pagination
                       chrome all come from .grid-shell, which TableContainer
                       applies to itself. All this wrapper still owns is the
                       entrance animation and its link in the height chain. */
                    className="page-fit-body mt-4"
                >
                    <TableContainer
                        columns={columns}
                        data={processedData}
                        isGlobalFilter={true}
                        isPagination={true}
                        isCustomPageSize={true}
                        SearchPlaceholder="Search From Table"
                        pagination="pagination"
                        buttonClass="btn-success"
                        paginationWrapper='dataTables_paginate paging_simple_numbers'
                        /* Column widths come from each column's `size` and stay
                           put as you page through the data, instead of the
                           browser re-measuring them against whatever happens to
                           be on screen. Values longer than two lines are cut
                           with an ellipsis. */
                        cellLines={2}
                        /* table-nowrap / nowrap dropped: they pin every cell to
                           a single line, which leaves cellLines nothing to
                           wrap. */
                        tableClass="dt-responsive w-full dataTable no-footer dtr-inline"
                        theadClass="sticky top-0 z-10"
                        isStickyHeader={true}
                        /* Clicking anywhere else on the row opens the
                           customer's full 360 view. The View / Edit buttons
                           stop propagation so they keep their own jobs. */
                        handleUserClick={(row) => setDetailCustomer(row?.customer_name)}
                        stickyTop={0}
                        /* Rows absorb the leftover height, so the grid is the
                           only thing on the screen that scrolls. */
                        fillHeight
                        /* The sub-992px cap only; fillHeight drops it above
                           that, where there is height to hand out. */
                        tableHeight="72vh"
                    />
                </motion.div>
            </div>

            {/* Mounted only while a row is selected, so each open is a fresh
                fetch rather than a component holding the previous customer's
                data behind a closed dialog. */}
            {detailCustomer && (
                <Customer360Modal
                    customerName={detailCustomer}
                    onClose={() => setDetailCustomer(null)}
                />
            )}

            <SimpleModal
                isOpen={!!copyTarget}
                setIsOpen={(open) => { if (!open) setCopyTarget(null); }}
                successButtonName="Copy to Clipboard"
                onSuccess={handleCopyConfirm}
                cancelButtonName="Close"
                onCancel={() => setCopyTarget(null)}
                size="md"
            >
                <h5 className="mb-1">Copy Account Details</h5>
                <p className="mb-3 text-xs text-ink-muted">
                    {copyTarget?.customer_name} — Password and Service Type aren't in this
                    record, so fill them in here before copying if they're needed.
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <FormGroup>
                        <Label>Password</Label>
                        <Input
                            value={copyPassword}
                            onChange={(e) => setCopyPassword(e.target.value)}
                            placeholder="Not in system — enter manually"
                        />
                    </FormGroup>
                    <FormGroup>
                        <Label>Service Type</Label>
                        <Input
                            value={copyServiceType}
                            onChange={(e) => setCopyServiceType(e.target.value)}
                            placeholder="Not in system — enter manually"
                        />
                    </FormGroup>
                </div>
                <Label className="mb-1 mt-2 block">Preview</Label>
                <textarea
                    readOnly
                    rows={6}
                    value={copyPreview}
                    onFocus={(e) => e.target.select()}
                    className="w-full rounded-lg border border-white/10 bg-white/5 p-2 font-mono text-[12px] text-ink"
                />
            </SimpleModal>
        </div>
    );
};

export default UserManagementList;
