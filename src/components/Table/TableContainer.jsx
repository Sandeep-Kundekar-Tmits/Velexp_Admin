import React, { Fragment, useEffect, useState } from "react";
import { Row, Table, Button, Col, Spinner, Tooltip } from "reactstrap";
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
        <div className="position-relative d-flex align-items-center w-100 " style={{ borderLeft: "1px solid #B0ACAC", paddingLeft: "10px", height: "45px" }}>
            <FaSearch
                className="position-absolute ms-1 text-muted"
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
                    className="position-absolute end-0 me-2 text-muted"
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
    defaultPageSize = 10,
    tableHeight = null,
    isStickyHeader = false,
    isStickyFooter = false,
    stickyTop = 0
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
        globalFilterFn: fuzzyFilter,
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
    // useEffect(() => {
    //   Number(customPageSize) && setPageSize(Number(customPageSize));
    // }, [customPageSize, setPageSize]);

    return (
        <div style={{ border: "solid #B0ACAC 1px" }}>
            <div className="rounded-1 mt-0">
                <div className="d-flex flex-wrap mb-0 align-items-center  p-0 justify-content-between" style={{ height: "45px" }} >
                    {/* Left section (Page size + Excel download) */}
                    <div className="d-flex  align-items-center w-75 mb-0 p-0">
                        {isCustomPageSize && defaultPageSize === 10 && (
                            <div className=" mb-0 d-flex align-items-center" style={{ minWidth: "90px", borderRight: "solid #B0ACAC 1px", height: "45px", marginLeft: "10px", marginRight: "10px" }}>
                                <select
                                    className="form-select pageSize  border-0 "

                                    value={table.getState().pagination.pageSize}
                                    onChange={e => {
                                        table.setPageSize(Number(e.target.value));
                                    }}
                                >
                                    {[10, 20, 30, 40, 50].map(pageSize => (
                                        <option key={pageSize} value={pageSize}>
                                            Show {pageSize}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        {
                            <div style={{ marginRight: "10px" }}>
                                {
                                    extraFiled && extraFiled
                                }
                            </div>
                        }

                        {isDownloadExcle && (
                            <div className="me-2 mb-0 my-0 d-flex align-items-center">
                                <Button
                                    disabled={data.length < 1}
                                    onClick={onDownloadExcle}
                                    className="d-flex align-items-center px-2 bg-transparent border-success text-success"
                                    style={{
                                        height: "35px",
                                        borderRadius: "4px",
                                        fontWeight: "500",
                                        // marginLeft: "10px"
                                    }}
                                >
                                    {
                                        ExcleLoading ? <span className="me-2">Exporting...</span> : <span className="me-2">Download Excel</span>
                                    }
                                    <FaFileExcel size={18} className="me-2" />
                                </Button>
                            </div>
                        )}
                        {excelItems.map((item, index) => {
                            if (!item.show) return null;

                            return (
                                <div key={index} className="me-2 mb-1 position-relative">
                                    <Button
                                        id={`excel-btn-${index}`}
                                        disabled={item.disabled || item.loading || data.length < 1}
                                        onClick={item.onClick ?? (() => { })}
                                        className="d-flex align-items-center px-2 bg-transparent border-success text-success"
                                        style={{
                                            borderRadius: "10px",
                                            fontWeight: "500",
                                            paddingTop: "7px",
                                            paddingBottom: "7px",
                                        }}
                                    >
                                        {item.loading ? (
                                            <>
                                                <Spinner size="sm" className="me-2" />
                                                Exporting...
                                            </>
                                        ) : (
                                            <>
                                                <span className="me-2">{item.label}</span>
                                                <FaFileExcel size={18} />
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

                    {/* Right section (Search) */}
                    <div className="w-25 d-flex justify-content-end align-items-center">
                        {
                            ShowClearBtn && <Button onClick={OnClearClick} className="bg-danger border-0 mb-0 me-2" style={{ height: "34px", width: "100px" }}>Clear</Button>
                        }
                        <div className="mb-0 w-100" >
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
                        // borderTop: "solid #B0ACAC 1px",
                        ...(tableHeight ? { maxHeight: tableHeight, overflow: 'auto' } : {})
                    }}
                    className={divClassName ? divClassName : "table-responsive"}
                >
                    <Table hover className={tableClass} bordered={isBordered}>
                        <thead
                            className={`${theadClass} bg-light`}
                            style={isStickyHeader ? { position: 'sticky', borderTop: "1px solid #B0ACAC", top: stickyTop, zIndex: 2 } : {}}
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
                                                    border: 'solid #B0ACAC 1px',
                                                    verticalAlign: 'middle',
                                                    textAlign: 'center',
                                                    backgroundColor: '#f8f9fa' // Ensure background color for sticky
                                                }}
                                            >
                                                {flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            </th>
                                        );
                                    })}
                                </tr>
                            ))}
                        </thead>


                        {
                            getRowModel().rows.length > 0 ? <tbody className="" style={{ border: "solid #B0ACAC 1px " }}>
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
                                                    return (
                                                        <td className="text-wrap " key={cell.id}>
                                                            {flexRender(
                                                                cell.column.columnDef.cell,
                                                                cell.getContext()
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                            </tr>
                                        );
                                    })
                                }
                            </tbody>
                                : <tr>
                                    <td
                                        colSpan={table.getVisibleLeafColumns().length}
                                        className="text-center fw-bold p-3 border-0"
                                        style={{ background: "#DBDBDB" }}
                                    >
                                        No Data
                                    </td>
                                </tr>

                        }
                        {hasFooter && (
                            <tfoot
                                className="bg-light"
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
                                                    className="fw-bold text-center"
                                                    style={{
                                                        border: 'solid #B0ACAC 1px',
                                                        backgroundColor: '#f8f9fa', // Ensure background color for sticky
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
                    <Row className=" mx-2" style={{ marginTop: "0px" }}>
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