import React, { Fragment, useEffect, useState, useMemo } from "react";
import { Row, Table, Button, Col } from "reactstrap";
import { Link } from "react-router-dom";
import { FixedSizeList as List } from 'react-window';
import { useReactTable, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, flexRender } from '@tanstack/react-table';
import { rankItem } from '@tanstack/match-sorter-utils';

// Web Worker setup


// Column Filter Component
const Filter = ({ column }) => {
  const columnFilterValue = column.getFilterValue();

  return (
    <DebouncedInput
      type="text"
      value={columnFilterValue ?? ''}
      onChange={value => column.setFilterValue(value)}
      placeholder="Search..."
      className="w-36 border shadow rounded"
      list={column.id + 'list'}
    />
  );
};

// Optimized Debounced Input
const DebouncedInput = ({ value: initialValue, onChange, debounce = 500, ...props }) => {
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
    <Col sm={4}>
      <input {...props} value={value} onChange={e => setValue(e.target.value)} />
    </Col>
  );
};

// Virtualized Row Component
const VirtualRow = ({ index, style, rows, prepareRow }) => {
  const row = rows[index];
  prepareRow(row);
  return (
    <div style={style}>
      <tr key={row.id}>
        {row.getVisibleCells().map(cell => (
          <td key={cell.id}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </td>
        ))}
      </tr>
    </div>
  );
};

const LargeDataSetTabelContainer = ({
  columns,
  data: initialData=[],
  tableClass,
  theadClass,
  divClassName,
  isBordered,
  isPagination,
  isGlobalFilter,
  paginationWrapper,
  SearchPlaceholder,
  pagination,
  buttonClass,
  buttonName,
  isAddButton,
  isCustomPageSize,
  handleUserClick,
}) => {

    const [worker] = useState(() => {
        const workerCode = `
          const filterFn = (data, filters, globalFilter) => {
            // Implement actual filtering logic here
            return data.filter(item => {
              // Example: Global filter
              if (globalFilter) {
                const matches = Object.values(item).some(val => 
                  String(val).toLowerCase().includes(globalFilter.toLowerCase())
                );
                if (!matches) return false;
              }
              
              // Example: Column filters
              if (filters && filters.length > 0) {
                return filters.every(filter => {
                  const value = item[filter.id];
                  return String(value).toLowerCase().includes(filter.value.toLowerCase());
                });
              }
              
              return true;
            });
          };
          
          self.onmessage = (e) => {
            const { data, filters, globalFilter } = e.data;
            const result = filterFn(data, filters, globalFilter);
            postMessage(result);
          };
        `;
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        return new Worker(URL.createObjectURL(blob));
      });
    
      // OR APPROACH 2: External worker function (if you prefer separation)
      // const [worker] = useState(() => createWorker());
    
      // 2. State management
      const [processedData, setProcessedData] = useState([]);
      const [displayData, setDisplayData] = useState([]);
      const [loadedCount, setLoadedCount] = useState(5000);
      const [columnFilters, setColumnFilters] = useState([]);
      const [globalFilter, setGlobalFilter] = useState('');
    
      // 3. Worker communication
      useEffect(() => {
        worker.onmessage = (e) => {
          setProcessedData(e.data);
          setDisplayData(e.data.slice(0, loadedCount));
        };
    
        return () => worker.terminate();
      }, [loadedCount]);
    
      useEffect(() => {
        if (!Array.isArray(initialData)) {
            setProcessedData([]);
            setDisplayData([]);
            return;
          }
        // Send only serializable data
        const serializableData = initialData?.map(item => {
          // Extract only primitive values
          const { id, name, age /* etc */ } = item;
          return { id, name, age };
        });
    
        worker.postMessage({
          data: serializableData,
          filters: columnFilters,
          globalFilter
        });
      }, [initialData, columnFilters, globalFilter]);
      const memoizedColumns = useMemo(() => columns, [columns]);
  // Load more data when scrolling
  const loadMoreData = () => {
    if (loadedCount < processedData.length) {
      setLoadedCount(prev => Math.min(prev + 5000, processedData.length));
      setDisplayData(processedData.slice(0, loadedCount + 5000));
    }
  };

  // Table instance
  const table = useReactTable({
    columns: memoizedColumns,
    data: displayData,
    filterFns: {
      fuzzy: (row, columnId, value) => {
        return rankItem(row.getValue(columnId), value).passed;
      },
    },
    state: {
      columnFilters,
      globalFilter,
    },
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
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
    getState,
    prepareRow,
  } = table;

  // Virtualization setup
  const { rows } = getRowModel();
  const tableHeight = 600; // Adjust based on your needs
  const rowHeight = 50; // Adjust based on your row content

  return (
    <Fragment>
      <Row className="mb-2">
        {isCustomPageSize && (
          <Col sm={2}>
            <select
              className="form-select pageSize mb-2"
              value={table.getState().pagination.pageSize}
              onChange={e => table.setPageSize(Number(e.target.value))}
            >
              {[10, 20, 30, 40, 50].map(pageSize => (
                <option key={pageSize} value={pageSize}>Show {pageSize}</option>
              ))}
            </select>
          </Col>
        )}

        {isGlobalFilter && (
          <DebouncedInput
            value={globalFilter ?? ''}
            onChange={value => setGlobalFilter(String(value))}
            className="form-control search-box me-2 mb-2 d-inline-block"
            placeholder={SearchPlaceholder}
          />
        )}

        {isAddButton && (
          <Col sm={6}>
            <div className="text-sm-end">
              <Button type="button" className={buttonClass} onClick={handleUserClick}>
                <i className="mdi mdi-plus me-1"></i> {buttonName}
              </Button>
            </div>
          </Col>
        )}
      </Row>

      <div className={divClassName || "table-responsive"}>
        <Table hover className={tableClass} bordered={isBordered}>
          <thead className={theadClass}>
            {getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th key={header.id} colSpan={header.colSpan}>
                    <div
                      className={header.column.getCanSort() ? 'cursor-pointer select-none' : ''}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                    {header.column.getCanFilter() && (
                      <Filter column={header.column} />
                    )}
                  </th>
                ))}
              </tr>
            ))}
          </thead>

          <tbody>
            <List
              height={tableHeight}
              itemCount={rows.length}
              itemSize={rowHeight}
              width="100%"
              onItemsRendered={({ visibleStopIndex }) => {
                if (visibleStopIndex >= loadedCount - 20) {
                  loadMoreData();
                }
              }}
            >
              {({ index, style }) => {
                const row = rows[index];
                prepareRow(row);
                return (
                  <div style={style}>
                    <tr key={row.id}>
                      {row.getVisibleCells().map(cell => (
                        <td key={cell.id}>
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </td>
                      ))}
                    </tr>
                  </div>
                );
              }}
            </List>
          </tbody>
        </Table>
      </div>

      {isPagination && (
        <Row>
          <Col sm={12} md={5}>
            <div className="dataTables_info">
              Showing {getState().pagination.pageIndex + 1} to{' '}
              {Math.min(
                (getState().pagination.pageIndex + 1) * getState().pagination.pageSize,
                processedData.length
              )}{' '}
              of {processedData.length} Results
            </div>
          </Col>
          <Col sm={12} md={7}>
            <div className={paginationWrapper}>
              <ul className={pagination}>
                <li className={`paginate_button page-item previous ${!getCanPreviousPage() ? "disabled" : ""}`}>
                  <Link to="#" className="page-link" onClick={previousPage}>
                    <i className="mdi mdi-chevron-left"></i>
                  </Link>
                </li>
                {getPageOptions().map((item, key) => (
                  <li key={key} className={`paginate_button page-item ${getState().pagination.pageIndex === item ? "active" : ""}`}>
                    <Link to="#" className="page-link" onClick={() => setPageIndex(item)}>
                      {item + 1}
                    </Link>
                  </li>
                ))}
                <li className={`paginate_button page-item next ${!getCanNextPage() ? "disabled" : ""}`}>
                  <Link to="#" className="page-link" onClick={nextPage}>
                    <i className="mdi mdi-chevron-right"></i>
                  </Link>
                </li>
              </ul>
            </div>
          </Col>
        </Row>
      )}
    </Fragment>
  );
};

export default LargeDataSetTabelContainer;