import { useCallback, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { LoaderMark } from "@/Loaders/Loader";
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
    <div className="page-content py-0 px-0">
      <div
        className="bg-white sticky-top"
        style={{ position: "sticky", top: "0px", zIndex: 1001, width: "100%" }}
      >
        <MainHeaderComp title={config.title} />
      </div>

      <div className="container-fluid px-4">
        <div className="mt-4">
          <FilterBar
            filters={config.filters}
            values={values}
            onChange={onChange}
            onSubmit={onSubmit}
            isLoading={isFetching}
          />
        </div>

        <div className="mt-1">
          {isFetching ? (
            <div
              style={{ height: "40vh" }}
              className="container-fluid flex flex-col justify-center items-center"
            >
              <LoaderMark />
              <p className="mt-12 h5">{config.loadingText ?? `Loading ${config.title} ...`}</p>
            </div>
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
              tableClass="table-bordered table-nowrap dt-responsive nowrap w-full dataTable no-footer dtr-inline"
            />
          )}
        </div>
      </div>
    </div>
  );
}

ReportPage.propTypes = { config: PropTypes.object.isRequired };
