import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import Loader from "@/Loaders/Loader";
import MainHeaderComp from "@/components/MainHeaderCom";
import TableContainer from "@/components/Table/TableContainer";
import { useExcelExport } from "@/hooks/useExcelExport";
import FilterBar from "./FilterBar";
import { useReportQuery } from "./useReportQuery";
import { makeRowMapper } from "./reportExport";

/**
 * Renders a whole report screen from a ReportConfig.
 *
 * Deliberately reuses the existing TableContainer and useExcelExport rather
 * than introducing a new table or export path. The engine's job is to remove
 * the duplicated filter/payload/export boilerplate; changing how rows render
 * or how the workbook is written at the same time would make any visual or
 * data difference impossible to attribute.
 *
 * @param {{config: import("./types").ReportConfig}} props
 */
export default function ReportPage({ config }) {
  const [values, setValues] = useState({});
  const { rows, isFetching, run } = useReportQuery(config);
  const { exportToExcel, isExporting } = useExcelExport();

  const columns = useMemo(
    () =>
      config.columns.map((c) => ({
        header: c.header,
        accessorKey: c.key,
        enableColumnFilter: false,
        enableSorting: true,
        ...(c.size ? { size: c.size } : {}),
        ...(c.cell ? { cell: (info) => c.cell(info.getValue(), info.row.original) } : {}),
      })),
    [config]
  );

  const onChange = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  /** Returns the payload, or null when a required filter is missing. */
  const buildOrWarn = useCallback(() => {
    for (const f of config.filters) {
      if (!f.required) continue;
      const v = values[f.name];
      const empty =
        v == null ||
        (f.type === "dateRange" && (!v.startDate || !v.endDate)) ||
        (Array.isArray(v) && v.length === 0);
      if (empty) {
        // Matches the legacy screens, which alert() rather than inline-validate.
        alert(`Please select ${f.label ?? f.name}`);
        return null;
      }
    }
    return config.buildPayload(values);
  }, [config, values]);

  const onSubmit = useCallback(() => {
    const payload = buildOrWarn();
    if (payload) run(payload);
  }, [buildOrWarn, run]);

  const onDownload = useCallback(() => {
    const payload = buildOrWarn();
    if (!payload) return;
    // The SAME buildPayload feeds the request and the spreadsheet's
    // "filters applied" banner, so the two cannot drift apart the way the
    // hand-copied legacy versions did.
    exportToExcel(rows, config.export?.fileName ?? config.key, makeRowMapper(config), payload);
  }, [buildOrWarn, config, exportToExcel, rows]);

  return (
    /* page-fit + page-fit-body down to the grid: the rows absorb the height
       left under the filter bar, so the report is the only thing that scrolls
       instead of the page and the grid scrolling against each other. */
    <div className="page-content page-fit py-0 px-0">
      {/* No sticky wrapper: MainHeaderComp draws nothing inline now, it hands
          the title to the layout's PageHeader, which is already fixed above
          the scroll box. */}
      <MainHeaderComp title={config.title} />

      <div className="container-fluid page-fit-body px-4">
        <div className="mt-4">
          <FilterBar
            filters={config.filters}
            values={values}
            onChange={onChange}
            onSubmit={onSubmit}
            isLoading={isFetching}
          />
        </div>

        <div className="page-fit-body mt-1">
          {isFetching ? (
            <Loader
              message={config.loadingText ?? `Loading ${config.title} ...`}
              fullscreen={false}
            />
          ) : (
            <TableContainer
              isCustomPageSize
              columns={columns}
              data={rows}
              isGlobalFilter
              isDownloadExcle
              isPagination
              onDownloadExcle={onDownload}
              ExcleLoading={isExporting}
              SearchPlaceholder="Search From Table"
              pagination="pagination"
              paginationWrapper="dataTables_paginate paging_simple_numbers"
              /* table-bordered dropped: .grid-shell draws the row rules now,
                 so it only fought them. */
              tableClass="table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
              theadClass="sticky top-0 z-10"
              isStickyHeader={true}
              stickyTop={0}
              fillHeight
            />
          )}
        </div>
      </div>
    </div>
  );
}

ReportPage.propTypes = { config: PropTypes.object.isRequired };
