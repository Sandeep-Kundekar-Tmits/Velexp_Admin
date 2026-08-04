import { useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui";
import { useNavigate } from "react-router-dom";
import TableContainer from "../../components/Table/TableContainer";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { GET_ALL_USER_LIST, GET_USER_API } from "../../api";
import usePostApiCall from "../../hooks/usePostApiCall";
import AmbientBackground from "../../components/Common/AmbientBackground";
import Loader from "../../Loaders/Loader";
import { motion } from "framer-motion";
import { Building2, ChevronRight, Eye, Handshake, Pencil, Store, UserPlus, Users } from "lucide-react";
import { cn } from "@/lib/cn";

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

/* Reskins TableContainer from the outside. It renders plain table/thead/th/td
   plus .page-item/.page-link pagination, so descendant variants restyle all of
   it without editing the shared component that 80 other pages depend on. */
const TABLE_SKIN = cn(
    "[&_table]:!border-separate [&_table]:!border-spacing-0 [&_table]:w-full",
    // Header: sticky, opaque enough that rows scrolling under it stay hidden.
    "[&_thead]:!bg-[#0d1424] [&_thead_th]:!bg-[#0d1424] [&_thead_th]:!border-0",
    "[&_thead_th]:!text-[11px] [&_thead_th]:!font-semibold [&_thead_th]:!uppercase",
    "[&_thead_th]:!tracking-wider [&_thead_th]:!text-[#94A3B8] [&_thead_th]:!py-3.5",
    "[&_thead_th]:!border-b [&_thead_th]:!border-white/8",
    // Body: zebra striping plus a hover lift.
    "[&_tbody]:!border-0",
    "[&_tbody_tr]:!border-0 [&_tbody_tr]:transition-colors [&_tbody_tr]:duration-200",
    "[&_tbody_tr:nth-child(odd)]:!bg-white/[0.02]",
    "[&_tbody_tr:hover]:!bg-[#3B82F6]/10",
    "[&_tbody_td]:!border-0 [&_tbody_td]:!border-b [&_tbody_td]:!border-white/5",
    "[&_tbody_td]:!py-3 [&_tbody_td]:!text-[13px] [&_tbody_td]:!text-slate-200",
    // Search box and page-size select that TableContainer renders above the grid.
    "[&_.form-control]:!bg-white/[0.04] [&_.form-control]:!border [&_.form-control]:!border-white/8",
    "[&_.form-control]:!text-white [&_.form-control]:!rounded-lg [&_.form-control]:placeholder:!text-[#94A3B8]/60",
    "[&_select]:!bg-[#0d1424] [&_select]:!text-white [&_select]:!border-white/8 [&_select]:!rounded-lg",
    // Pagination.
    "[&_.dataTables_info]:!text-[#94A3B8] [&_.dataTables_info]:!text-[12px]",
    "[&_.page-link]:!bg-white/[0.04] [&_.page-link]:!border-white/8 [&_.page-link]:!text-slate-300",
    "[&_.page-link]:!rounded-lg [&_.page-link]:!mx-0.5 [&_.page-link]:transition-colors",
    "[&_.page-item:hover_.page-link]:!bg-[#3B82F6]/20 [&_.page-item:hover_.page-link]:!text-white",
    "[&_.page-item.active_.page-link]:!bg-[#3B82F6] [&_.page-item.active_.page-link]:!text-white",
    "[&_.page-item.active_.page-link]:!border-[#3B82F6]",
    "[&_.page-item.disabled_.page-link]:!opacity-40"
);

const UserManagementList = () => {
    // Document title effect
    useEffect(() => {
        document.title = "User Management";
    }, []);

    const navigate = useNavigate();
    const { apifunc: getUser, data, loading } = usePostApiCall();

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

    // Memoized columns configuration
    const columns = useMemo(() => [
        {
            header: 'First name',
            accessorKey: 'first_name',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Last name',
            accessorKey: 'last_name',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Email',
            accessorKey: 'email',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Phone',
            accessorKey: 'phone',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Customer Type',
            accessorKey: 'cust_type',
            enableColumnFilter: false,
            enableSorting: true,
            cell: ({ row }) => {
                const type = row.original.cust_type?.type_of_cust?.trim();
                if (!type) return "--";
                return (
                    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-[11px] font-medium text-slate-200">
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
            cell: ({ getValue }) => getValue()?.trim() || "--",
        },
        {
            header: 'Actions',
            accessorKey: 'actions',
            enableColumnFilter: false,
            enableSorting: false,
            cell: ({ row }) => (
                <div className="flex gap-2">
                    <Button
                        color="success"
                        size="sm"
                        onClick={() => handleView(row.original)}
                        aria-label={`View ${row.original?.customer_name || "customer"}`}
                        className="gap-1.5 rounded-lg border border-[#3B82F6]/30 bg-[#3B82F6]/15 text-[#93C5FD] transition-all duration-200 hover:bg-[#3B82F6]/25 hover:text-white hover:shadow-[0_0_18px_-4px_rgba(59,130,246,0.9)]"
                    >
                        <Eye aria-hidden="true" className="size-3.5" />
                        View
                    </Button>
                    <Button
                        color="primary"
                        size="sm"
                        onClick={() => handleEdit(row.original)}
                        aria-label={`Edit ${row.original?.customer_name || "customer"}`}
                        className="gap-1.5 rounded-lg border border-[#8B5CF6]/30 bg-[#8B5CF6]/15 text-[#C4B5FD] transition-all duration-200 hover:bg-[#8B5CF6]/25 hover:text-white hover:shadow-[0_0_18px_-4px_rgba(139,92,246,0.9)]"
                    >
                        <Pencil aria-hidden="true" className="size-3.5" />
                        Edit
                    </Button>
                </div>
            ),
        },
    ], [handleEdit, handleView]);

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
            <div className="relative flex h-full min-h-full flex-col bg-[#050816]">
                <AmbientBackground showSpotlight={false} />
                {/* Inline, not fixed: this replaces the page body while the
                    layout chrome around it stays interactive. */}
                <Loader message="Loading customers..." fullscreen={false} className="relative z-10 flex-1 bg-transparent backdrop-blur-none" />
            </div>
        )
    }

    return (
        <div className="page-content relative min-h-full overflow-x-hidden bg-[#050816] px-0 py-0 antialiased">
            {/* Reused from the login screen. Spotlight is off here: this is a
                work surface, and a cursor-tracking glow behind a data grid is
                a distraction rather than a flourish. */}
            <AmbientBackground showSpotlight={false} clearCentre={false} />

            <div className="relative z-10 px-4 py-6 sm:px-6">
                {/* Breadcrumb. Plain text, not links -- adding navigation targets
                    would be new routing, which is out of scope here. */}
                <nav aria-label="Breadcrumb" className="mb-4">
                    <ol className="flex items-center gap-1.5 text-[12px] text-[#94A3B8]">
                        <li>Dashboard</li>
                        <li aria-hidden="true"><ChevronRight className="size-3.5" /></li>
                        <li className="font-medium text-slate-300" aria-current="page">User Management</li>
                    </ol>
                </nav>

                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE }}
                    className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
                >
                    <div>
                        <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-[28px]">
                            User Management
                        </h1>
                        <p className="mt-1.5 text-[14px] text-[#94A3B8]">
                            Manage corporate, franchise and retail customers.
                        </p>
                    </div>

                    <motion.button
                        type="button"
                        onClick={handleAddUser}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ duration: 0.2, ease: EASE }}
                        className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-linear-to-r from-[#3B82F6] to-[#8B5CF6] px-5 text-[14px] font-semibold text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.8)] transition-shadow duration-200 hover:shadow-[0_16px_40px_-10px_rgba(139,92,246,0.9)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#38BDF8]"
                    >
                        <UserPlus aria-hidden="true" className="size-4" />
                        Add User
                    </motion.button>
                </motion.div>

                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {stats.map(({ label, value, Icon, accent }, index) => (
                        <motion.div
                            key={label}
                            custom={index}
                            variants={cardVariants}
                            initial="hidden"
                            animate="show"
                            whileHover={{ y: -3 }}
                            className="group rounded-2xl border border-white/8 bg-[rgba(17,24,39,0.70)] p-5 backdrop-blur-xl transition-colors duration-200 hover:border-white/[0.16]"
                        >
                            <div className="flex items-start justify-between">
                                <p className="text-[12px] font-medium uppercase tracking-wider text-[#94A3B8]">
                                    {label}
                                </p>
                                <span
                                    className={cn(
                                        "flex size-9 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] transition-shadow duration-200",
                                        STAT_ACCENTS[accent]
                                    )}
                                >
                                    <Icon aria-hidden="true" className="size-4.5" />
                                </span>
                            </div>
                            <p className="mt-3 text-3xl font-semibold tracking-tight text-white">
                                {value.toLocaleString()}
                            </p>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, ease: EASE, delay: 0.2 }}
                    className={cn(
                        "mt-6 overflow-hidden rounded-2xl border border-white/8 bg-[rgba(17,24,39,0.70)] backdrop-blur-xl",
                        "shadow-[0_24px_70px_-30px_rgba(2,6,23,0.9)]",
                        TABLE_SKIN
                    )}
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
                        tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
                        theadClass="sticky top-0 z-10"
                        isStickyHeader={true}
                        stickyTop={0}
                        tableHeight="72vh"
                    />
                </motion.div>
            </div>
        </div>
    );
};

export default UserManagementList;
