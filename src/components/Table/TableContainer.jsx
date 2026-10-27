import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Row, Table, Button, Col, Spinner, Tooltip } from "@/components/ui";
import { Link } from "react-router-dom";

import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender
} from '@tanstack/react-table';

import { rankItem } from '@tanstack/match-sorter-utils';
import { FaFileExcel, FaSearch, FaTimes } from "react-icons/fa";
import PageHeaderActions from "../VerticalLayout/PageHeaderActions";
import OverlayTrigger from "rsuite/esm/internals/Overlay/OverlayTrigger";
// import JobListGlobalFilter from "./GlobalSearchFilter";

// Column Filter
const Filter = ({
    column
}) => {
    const columnFilterValue = column.getFilterValue();

    return (
        <>
            <DebouncedInput
                type="text"
                value={(columnFilterValue ?? '')}
                onChange={value => column.setFilterValue(value)}
                placeholder="Search..."
                className="w-36 border shadow rounded"
                list={column.id + 'list'}
            />
            <div className="h-1" />
        </>
    );
};

const DebouncedInput = ({
    value: initialValue,
    onChange,
    debounce = 500,
    ...props
}) => {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            onChange(value);
        }, debounce);

        return () => clearTimeout(timeout);
    }, [debounce, onChange, value]);

    return (
        <div className="table-search relative flex items-center w-full " style={{ borderLeft: "1px solid var(--color-line)", paddingLeft: "10px", height: "45px" }}>
            <FaSearch
                className="absolute ml-1 text-ink-muted"
                style={{ zIndex: 1, fontSize: "14px" }}
            />
            <input
                {...props}
                value={value}
                onChange={e => setValue(e.target.value)}
                className={`${props.className} ps-4 pe-4 border-none`}
                style={{ ...props.style, height: "38px" }}
            />
            {value && (
                <FaTimes
                    className="absolute end-0 mr-2 text-ink-muted"
                    style={{ zIndex: 1, cursor: "pointer", fontSize: "14px" }}
                    onClick={() => {
                        setValue('');
                        onChange('');
                    }}
                />
            )}
        </div>
    );
};

const TableContainer = ({
    headerAlign = "center",
    onDownloadExcle,
    isDownloadExcle,
    columns,
    data,
    tableClass,
    theadClass,
    divClassName,
    isBordered,
    isPagination,
    isGlobalFilter,
    paginationWrapper,
    SearchPlaceholder,
    ExcleLoading = false,
    ShowClearBtn = false,
    pagination,
    buttonClass,
    buttonName,
    isAddButton,
    isCustomPageSize,
    handleUserClick,
    OnClearClick,
    isJobListGlobalFilter,
    excelItems = [],
    extraFiled = null,
    rowSelection = {},
    onRowSelectionChange,
    /* 50, the largest option in the picker. Ten rows left most grids paging
       through data that would have fitted on one screen, now that fillHeight
       gives the row area the whole height under the chrome. Screens that pass
       their own value keep it. */
    defaultPageSize = 50,
    tableHeight = null,
    isStickyHeader = false,
    isStickyFooter = false,
    stickyTop = 0,
    rightExtraFiled = null,
    autoResetPageIndex = true,
    /**
     * Number of lines a cell may use before it is cut off with an ellipsis.
     *
     * Opt-in, because it also switches the table to `table-layout: fixed` --
     * columns stop resizing themselves around the longest value in the column,
     * which is the point (widths stay put as you page through data) but is a
     * real change for the 80 screens that were built against auto layout.
     *
     * Column widths then come from each column's TanStack `size`, so a page
     * that needs a narrow Actions column sets `size: 90` on it. Left unset,
     * every column defaults to 150 and they divide the width evenly.
     *
     * Action and select columns are never clamped: they hold controls, not
     * text, and cutting a button in half helps nobody.
     */
    cellLines = null,
    /**
     * Let the grid absorb the height left over on the screen, so the rows are
     * the only thing that scrolls.
     *
     * Only does anything if the page above it cooperates: the .page-content
     * root needs .page-fit and every wrapper down to here needs .page-fit-body,
     * or there is no leftover height to absorb. See layout-compat.css.
     *
     * `tableHeight` stays meaningful -- it is the cap below 992px, where there
     * is no spare height to hand out.
     */
    fillHeight = false,
    /**
     * Override the global search's match logic for this grid.
     *
     * Left unset, search uses match-sorter's fuzzy ranking (`fuzzyFilter`
     * below) -- lenient, but its scoring threshold can silently reject a
     * perfectly good match depending on what else is in the row, which reads
     * as "search doesn't work" with no visible reason. A screen whose search
     * needs to be predictable (e.g. always matching an exact code) passes its
     * own `(row, columnId, value) => boolean` here instead.
     */
    globalFilterFn = null,
}) => {

    const [columnFilters, setColumnFilters] = useState([]);
    const [globalFilter, setGlobalFilter] = useState('');


    const fuzzyFilter = (row, columnId, value, addMeta) => {
        const itemRank = rankItem(row.getValue(columnId), value);
        addMeta({
            itemRank
        });
        return itemRank.passed;
    };

    const table = useReactTable({
        columns,
        data,
        filterFns: {
            fuzzy: fuzzyFilter,
        },
        state: {
            columnFilters,
            globalFilter,
            rowSelection,
        },
        initialState: {
            pagination: {
                pageSize: defaultPageSize,
            },
        },
        onColumnFiltersChange: setColumnFilters,
        onGlobalFilterChange: setGlobalFilter,
        onRowSelectionChange: onRowSelectionChange,
        globalFilterFn: globalFilterFn || fuzzyFilter,
        autoResetPageIndex,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
    });

    const {
        getHeaderGroups,
        getRowModel,
        getCanPreviousPage,
        getCanNextPage,
        getPageOptions,
        setPageIndex,
        nextPage,
        previousPage,
        // setPageSize,
        getState
    } = table;

    const hasFooter = table
        .getAllLeafColumns()
        .some(col => col.columnDef.footer);

    /* The fixed list plus whatever size is actually in effect.
     *
     * A screen passing a size outside the list -- ShipmentBilling asks for 100
     * -- left the <select> with no matching <option>, so it rendered blank
     * while the grid really was showing 100 rows. Folding the current value in
     * means the control always states the truth. */
    const pageSizeOptions = useMemo(() => {
        const current = table.getState().pagination.pageSize;
        return [...new Set([10, 20, 30, 40, 50, current])].sort((a, b) => a - b);
    }, [table.getState().pagination.pageSize]);
    // useEffect(() => {
    //   Number(customPageSize) && setPageSize(Number(customPageSize));
    // }, [customPageSize, setPageSize]);

    return (
        /* `grid-shell` (layout-compat.css) is the whole look of the grid: the
           glass panel, the toolbar, the table and the pagination bar. It is
           applied here rather than by each screen so all ~81 of them share one
           definition -- and so a screen has to opt *out*, not in, which is the
           right default for a component this widely used.

           `table-toolbar`, `table-search` and `table-pagination` below are the
           selector hooks it needs; nothing else targets them. */
        <div
            className={`grid-shell${fillHeight ? " grid-shell-fill" : ""}`}
            style={{ border: "solid var(--color-line) 1px" }}
        >
            {/* Export controls live in the page header, not the grid toolbar.
                Doing it here rather than screen by screen moves them for all
                ~81 call sites at once, and keeps every screen's actions in the
                one place a user looks for them. Falls back to rendering in
                place when there is no header (see PageHeaderActions). */}
            {(isDownloadExcle || excelItems.some(item => item.show)) && (
                <PageHeaderActions>
                    <div className="flex items-center gap-2">
                        {isDownloadExcle && (
                            <Button
                                disabled={data.length < 1}
                                onClick={onDownloadExcle}
                                className="table-action-btn table-action-btn-solid"
                            >
                                <FaFileExcel size={15} aria-hidden="true" />
                                <span>{ExcleLoading ? "Exporting..." : "Download Excel"}</span>
                            </Button>
                        )}

                        {excelItems.map((item, index) => {
                            if (!item.show) return null;

                            return (
                                <div key={index} className="relative">
                                    <Button
                                        id={`excel-btn-${index}`}
                                        disabled={item.disabled || item.loading || data.length < 1}
                                        onClick={item.onClick ?? (() => { })}
                                        className="table-action-btn table-action-btn-export"
                                    >
                                        {item.loading ? (
                                            <>
                                                <Spinner size="sm" />
                                                <span>Exporting...</span>
                                            </>
                                        ) : (
                                            <>
                                                <FaFileExcel size={15} aria-hidden="true" />
                                                <span>{item.label}</span>
                                            </>
                                        )}
                                    </Button>

                                    {item.tooltip && (
                                        <Tooltip target={`excel-btn-${index}`} placement="top">
                                            {item.tooltip}
                                        </Tooltip>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </PageHeaderActions>
            )}

            <div className="rounded-1 mt-0">
                <div className="table-toolbar flex flex-wrap mb-0 items-center  p-0 justify-between" style={{ height: "45px" }} >
                    {/* Left section (page size + whatever the screen adds).
                        Was w-3/4 back when the export buttons lived here; it
                        now takes only what it needs so the search field can use
                        the rest.

                        min-w-0 is load-bearing: a flex item defaults to
                        min-width:auto and will not shrink below its content, so
                        a screen passing a wide `extraFiled` (a row of selects,
                        a date range) pushed this section past the panel and off
                        the side of the screen. */}
                    <div className="flex min-w-0 items-center mb-0 p-0">
                        {isCustomPageSize && (
                            <div className=" mb-0 flex items-center" style={{ minWidth: "90px", borderRight: "solid var(--color-line) 1px", height: "45px", marginLeft: "10px", marginRight: "10px" }}>
                                <select
                                    className="form-select pageSize  border-0 "

                                    value={table.getState().pagination.pageSize}
                                    onChange={e => {
                                        table.setPageSize(Number(e.target.value));
                                    }}
                                >
                                    {pageSizeOptions.map(pageSize => (
                                        <option key={pageSize} value={pageSize}>
                                            Show {pageSize}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {
                            <div className="min-w-0" style={{ marginRight: "10px" }}>
                                {
                                    extraFiled && extraFiled
                                }
                            </div>
                        }

                    </div>

                    {/* Right section (Search) */}
                    <div className="flex min-w-0 flex-1 justify-end items-center">
                        {
                            ShowClearBtn && <Button onClick={OnClearClick} className="bg-danger-500 border-0 mb-0 mr-2" style={{ height: "34px", width: "100px" }}>Clear</Button>
                        }
                        {rightExtraFiled && (
                            <div className="mr-1" style={{ borderRight: "1px solid var(--color-line)", paddingRight: "8px", height: "45px", display: "flex", alignItems: "center" }}>
                                {rightExtraFiled}
                            </div>
                        )}
                        {/* min-w-0 for the same reason as the left section: an
                            <input> has a default intrinsic width of ~20
                            characters, so without this the search box refuses
                            to shrink and widens the toolbar instead. */}
                        <div className="mb-0 w-full min-w-0" >
                            {isGlobalFilter && (
                                <DebouncedInput
                                    value={globalFilter ?? ""}
                                    onChange={value => setGlobalFilter(String(value))}
                                    className="form-control border-0"
                                    placeholder={SearchPlaceholder}
                                />
                            )}
                        </div>
                    </div>
                </div>



                <div
                    style={{
                        ...(tableHeight ? { maxHeight: tableHeight, overflow: 'auto' } : {})
                    }}
                    // scroll-slim always: the OS default scrollbar is a light
                    // grey column, and every grid now sits on a dark panel.
                    className={`scroll-slim ${divClassName ? divClassName : "table-responsive"}`}
                >
                    <Table
                        hover
                        className={`${tableClass} mb-0`}
                        bordered={isBordered}
                        style={{
                            borderCollapse: 'separate',
                            borderSpacing: 0,
                            ...(cellLines ? { tableLayout: 'fixed', width: '100%' } : {})
                        }}
                    >
                        <thead
                            className={`${theadClass} bg-light`}
                            style={isStickyHeader ? { position: 'sticky', top: stickyTop, zIndex: 2 } : { position: 'sticky', top: 0, zIndex: 2 }}
                        >
                            {table.getHeaderGroups().map(headerGroup => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map(header => {
                                        const isLeaf = header.subHeaders.length === 0;
                                        const rowSpan = isLeaf ? table.getHeaderGroups().length - headerGroup.depth : 1;

                                        if (header.isPlaceholder) return null;

                                        return (
                                            <th
                                                key={header.id}
                                                colSpan={header.colSpan}
                                                rowSpan={rowSpan}
                                                style={{
                                                    border: 'solid var(--color-line) 1px',
                                                    verticalAlign: 'middle',
                                                    textAlign: headerAlign,
                                                    backgroundColor: 'var(--color-surface)',
                                                    cursor: header.column.getCanSort() ? "pointer" : "default",
                                                    // Under table-layout:fixed the header row is what
                                                    // sets the column widths, so this is where the
                                                    // column's `size` has to land.
                                                    ...(cellLines ? { width: header.getSize() } : {})
                                                }}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                <div className={`flex items-center ${headerAlign === "left" ? "justify-start" : "justify-center"}`}>
                                                    {flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                                    {header.column.getCanSort() && (
                                                        <span className="ml-1" style={{ fontSize: "12px", color: "#888" }}>
                                                            {{
                                                                asc: <i className="mdi mdi-arrow-up"></i>,
                                                                desc: <i className="mdi mdi-arrow-down"></i>,
                                                            }[header.column.getIsSorted()] ?? <i className="mdi mdi-sort"></i>}
                                                        </span>
                                                    )}
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>


                        {
                            getRowModel().rows.length > 0 ? <tbody className="" style={{ border: "solid var(--color-line) 1px " }}>
                                {
                                    getRowModel().rows.map(row => {
                                        return (
                                            <tr
                                                key={row.id}
                                                className=""
                                                onClick={() => handleUserClick && handleUserClick(row.original)}
                                                style={{ cursor: handleUserClick ? "pointer" : "default" }}
                                            >
                                                {row.getVisibleCells().map(cell => {
                                                    const isActionOrSelect = cell.column.id === 'select' || cell.column.id === 'action' || cell.column.id === 'actions';
                                                    return (
                                                        <td 
                                                            className="text-wrap" 
                                                            key={cell.id}
                                                            style={{
                                                                verticalAlign: 'middle',
                                                                textAlign: isActionOrSelect ? 'center' : 'left',
                                                                padding: '10px 12px',
                                                                border: 'solid #eee 1px'
                                                            }}
                                                        >
                                                            {cellLines && !isActionOrSelect ? (
                                                                // -webkit-line-clamp needs a block container.
                                                                // A <td> cannot be one without dropping out
                                                                // of the table formatting context, hence the
                                                                // wrapper rather than clamping the cell.
                                                                <div
                                                                    className="table-cell-clamp"
                                                                    style={{ WebkitLineClamp: cellLines, lineClamp: cellLines }}
                                                                >
                                                                    {flexRender(
                                                                        cell.column.columnDef.cell,
                                                                        cell.getContext()
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                flexRender(
                                                                    cell.column.columnDef.cell,
                                                                    cell.getContext()
                                                                )
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                                : <tbody>
                                    <tr >
                                        <td
                                            colSpan={table.getVisibleLeafColumns().length}
                                            className="text-center font-bold p-4 border-0"
                                            style={{ background: "#DBDBDB" }}
                                        >
                                            No Data
                                        </td>
                                    </tr>
                                </tbody>
                        }
                        {hasFooter && (
                            <tfoot
                                className="bg-canvas"
                                style={isStickyFooter ? { position: 'sticky', bottom: 0, zIndex: 2 } : {}}
                            >
                                {table
                                    .getFooterGroups()
                                    .slice(0, 1)
                                    .map(footerGroup => (
                                        <tr key={footerGroup.id}>
                                            {footerGroup.headers.map(header => (
                                                <td
                                                    key={header.id}
                                                    colSpan={header.colSpan}
                                                    className="font-bold text-center"
                                                    style={{
                                                        border: 'solid var(--color-line) 1px',
                                                        backgroundColor: 'var(--color-surface)', // Ensure background color for sticky
                                                        ...(isStickyFooter ? { position: 'sticky', bottom: 0, zIndex: 1 } : {})
                                                    }}
                                                >
                                                    {header.isPlaceholder
                                                        ? null
                                                        : flexRender(
                                                            header.column.columnDef.footer,
                                                            header.getContext()
                                                        )}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                            </tfoot>
                        )}

                    </Table>
                </div>
            </div >


            {
                isPagination && (
                    <Row className="table-pagination mx-2" style={{ marginTop: "0px" }}>
                        <Col sm={12} md={5} style={{ alignItems: "center", display: "flex", marginLeft: "0px" }}>
                            <div className="dataTables_info">Showing {getState().pagination.pageIndex * getState().pagination.pageSize + 1} to {Math.min((getState().pagination.pageIndex + 1) * getState().pagination.pageSize, data.length)} of {data.length} Results</div>
                        </Col>
                        <Col sm={12} md={7}>
                            <div className={paginationWrapper}>
                                <ul className={pagination} style={{ flexWrap: 'wrap' }}>
                                    <li className={`paginate_button page-item previous ${!getCanPreviousPage() ? "disabled" : ""}`}>
                                        <Link to="#" className="page-link" onClick={previousPage}><i className="mdi mdi-chevron-left"></i></Link>
                                    </li>

                                    {/* Always show first page */}
                                    <li className={`paginate_button page-item ${getState().pagination.pageIndex === 0 ? "active" : ""}`}>
                                        <Link to="#" className="page-link" onClick={() => setPageIndex(0)}>1</Link>
                                    </li>

                                    {/* Show ellipsis if current page is far from start */}
                                    {getState().pagination.pageIndex > 2 && (
                                        <li className="paginate_button page-item disabled">
                                            <Link to="#" className="page-link">...</Link>
                                        </li>
                                    )}

                                    {/* Show pages around current page */}
                                    {getPageOptions()
                                        .filter(item =>
                                            item === getState().pagination.pageIndex - 1 ||
                                            item === getState().pagination.pageIndex ||
                                            item === getState().pagination.pageIndex + 1
                                        )
                                        .filter(item => item > 0 && item < getPageOptions().length - 1)
                                        .map((item, key) => (
                                            <li key={key} className={`paginate_button page-item ${getState().pagination.pageIndex === item ? "active" : ""}`}>
                                                <Link to="#" className="page-link" onClick={() => setPageIndex(item)}>{item + 1}</Link>
                                            </li>
                                        ))
                                    }

                                    {/* Show ellipsis if current page is far from end */}
                                    {getState().pagination.pageIndex < getPageOptions().length - 3 && (
                                        <li className="paginate_button page-item disabled">
                                            <Link to="#" className="page-link">...</Link>
                                        </li>
                                    )}

                                    {/* Always show last page if there's more than 1 page */}
                                    {getPageOptions().length > 1 && (
                                        <li className={`paginate_button page-item ${getState().pagination.pageIndex === getPageOptions().length - 1 ? "active" : ""}`}>
                                            <Link to="#" className="page-link" onClick={() => setPageIndex(getPageOptions().length - 1)}>
                                                {getPageOptions().length}
                                            </Link>
                                        </li>
                                    )}

                                    <li className={`paginate_button page-item next ${!getCanNextPage() ? "disabled" : ""}`}>
                                        <Link to="#" className="page-link" onClick={nextPage}><i className="mdi mdi-chevron-right"></i></Link>
                                    </li>
                                </ul>
                            </div>
                        </Col>
                    </Row>
                )
            }
        </div >
    );
};

export default TableContainer;