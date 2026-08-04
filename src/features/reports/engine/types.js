/**
 * Types for the config-driven report engine.
 *
 * A report screen is ~350 lines of the same shape repeated: filter state,
 * dropdown hydration, a payload builder, a fetch, a table, and a hand-typed
 * Excel mapping. A ReportConfig captures only what actually differs.
 *
 * @typedef {Object} FilterDescriptor
 * @property {string} name                    key in the filter state object
 * @property {"select"|"multiSelect"|"dateRange"|"text"} type
 * @property {string} [label]                 field label
 * @property {"customers"|"serviceCenters"|"products"|"regions"} [source]
 *           shared reference-data list to populate options from
 * @property {(row:any)=>string} [optionLabel]
 *           override the option label. CODReport shows "name-username" while
 *           most screens show just the name, so this cannot be global.
 * @property {{value:any,label:string}[]} [options]  static options
 * @property {boolean} [required]             blocks submit when empty
 * @property {number} [span]                  Bootstrap-style column span (1-12)
 * @property {string} [placeholder]
 *
 * @typedef {Object} ColumnDef
 * @property {string} header
 * @property {string} key                     accessor key on the row
 * @property {(value:any,row:any)=>any} [cell]  display formatter
 * @property {number} [size]
 *
 * @typedef {Object} ExportColumnDef
 * @property {string} header
 * @property {string} [key]
 * @property {(row:any)=>any} [value]         formatter for the cell's value
 *
 * @typedef {Object} ReportExportConfig
 * @property {string} fileName
 * @property {ExportColumnDef[]} [columns]
 *           Defaults to the table columns. Declared explicitly when the
 *           spreadsheet differs from the screen — CODReport exports 12 columns
 *           against 10 on screen, and formats Date differently. Deriving
 *           blindly from the table would silently drop those columns, so the
 *           divergence is made explicit rather than assumed away.
 *
 * @typedef {Object} ReportConfig
 * @property {string} key                     stable id, used in query keys
 * @property {string} title                   page header
 * @property {string} endpoint                URL constant to POST to
 * @property {FilterDescriptor[]} filters
 * @property {(filters:Object)=>Object} buildPayload
 *           The single source of truth for the request body. Several legacy
 *           screens build this twice (table + Excel banner) and the copies have
 *           already drifted; one builder makes that impossible.
 * @property {(response:any)=>any[]} [select]  unwrap rows, defaults to .bookings
 * @property {ColumnDef[]} columns
 * @property {ReportExportConfig} [export]
 * @property {string} [loadingText]
 */

export {};
