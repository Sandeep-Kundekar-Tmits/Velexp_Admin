/**
 * Builds the Excel row mapper for a report config.
 *
 * Legacy screens hand-type the spreadsheet's column list a second time,
 * separately from the table's column defs, so the two drift. Here the export
 * columns default to the table columns and are only spelled out when the
 * spreadsheet genuinely differs.
 */

/**
 * Resolve the effective export column list.
 * @param {import("./types").ReportConfig} config
 * @returns {import("./types").ExportColumnDef[]}
 */
export function exportColumns(config) {
  if (config.export?.columns?.length) return config.export.columns;
  return config.columns.map((c) => ({ header: c.header, key: c.key }));
}

/**
 * Row -> { "Header": value } in declared order, which is the order the columns
 * appear in the spreadsheet.
 * @param {import("./types").ReportConfig} config
 */
export function makeRowMapper(config) {
  const cols = exportColumns(config);
  return (row) => {
    const out = {};
    for (const col of cols) {
      out[col.header] = col.value ? col.value(row) : row?.[col.key];
    }
    return out;
  };
}

/** Header list in order — used by tests to compare against the baseline. */
export function exportHeaders(config) {
  return exportColumns(config).map((c) => c.header);
}
