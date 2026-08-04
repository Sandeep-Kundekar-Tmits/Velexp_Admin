import { format } from "date-fns";
import { COD_UPLOAD_REPORTS } from "@/api";

/**
 * COD Report — first screen migrated to the config-driven engine.
 *
 * Ported from the 305-line pages/Dashboard/Reports/CODReport.jsx. Every
 * externally-visible detail is reproduced deliberately, and asserted against
 * tests/baseline/reports.json:
 *
 *   - payload keys start_date / end_date / customer_name, dd-MM-yyyy dates,
 *     and the "All" default when no customer is chosen
 *   - the customer dropdown's "name-username" label, which most other screens
 *     do NOT use
 *   - 12 export columns against 10 on screen (Payment Mode and Consignee State
 *     are exported but not displayed), and the export's own Date formatting
 *
 * @type {import("../engine/types").ReportConfig}
 */
export const codReport = {
  key: "cod-report",
  title: "COD Report",
  endpoint: COD_UPLOAD_REPORTS,
  loadingText: "Loading COD Report ...",
  select: (res) => res?.bookings ?? [],

  filters: [
    {
      name: "customer",
      type: "select",
      label: "Select Customer",
      source: "customers",
      placeholder: "Search Customer",
      // Unique to this screen: options read "ACME-acme_user".
      optionLabel: (row) => `${row.customer_name}-${row?.username}`,
      span: 4,
    },
    {
      name: "dateRange",
      type: "dateRange",
      label: "Start Date and End Date",
      required: true,
      span: 4,
    },
  ],

  buildPayload: (f) => ({
    start_date: f.dateRange?.startDate ? format(f.dateRange.startDate, "dd-MM-yyyy") : "",
    end_date: f.dateRange?.endDate ? format(f.dateRange.endDate, "dd-MM-yyyy") : "",
    customer_name: f.customer?.value ? f.customer.value : "All",
  }),

  columns: [
    { header: "AWB No", key: "awbno" },
    { header: "Pickup Pincode", key: "pick_pincode" },
    { header: "Drop Pincode", key: "drop_pincode" },
    { header: "Weight (Kg)", key: "weight", cell: (v) => v ?? 0 },
    { header: "Shipment Value", key: "shipment_value", cell: (v) => v ?? 0 },
    { header: "Customer Name", key: "customer_name" },
    { header: "Origin SC", key: "orgsc" },
    { header: "Consignee City", key: "consignee_city" },
    { header: "Date", key: "date", size: 280, cell: (v) => v || "N/A" },
    { header: "COD Amount", key: "cod_amount", cell: (v) => v ?? 0 },
  ],

  export: {
    fileName: "COD_Details",
    // Spelled out because the spreadsheet is NOT the table: it carries two
    // extra columns and renders Date as "12 Mar 2026" rather than the raw
    // dd-MM-yyyy string. Deriving from `columns` would silently drop them.
    columns: [
      { header: "AWB No", key: "awbno" },
      { header: "Pickup Pincode", key: "pick_pincode" },
      { header: "Drop Pincode", key: "drop_pincode" },
      { header: "Weight (Kg)", value: (r) => r.weight ?? 0 },
      { header: "Shipment Value", value: (r) => r.shipment_value ?? 0 },
      { header: "Payment Mode", key: "paymentmode" },
      { header: "Customer Name", key: "customer_name" },
      { header: "Origin SC", key: "orgsc" },
      { header: "Consignee City", key: "consignee_city" },
      { header: "Consignee State", key: "consignee_state" },
      {
        header: "Date",
        value: (r) => {
          if (!r.date) return "N/A";
          // Stored as dd-MM-yyyy; reordered so Date parses it unambiguously.
          const [day, month, year] = r.date.split("-");
          return new Date(`${year}-${month}-${day}`).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          });
        },
      },
      { header: "COD Amount", value: (r) => r.cod_amount ?? 0 },
    ],
  },
};
