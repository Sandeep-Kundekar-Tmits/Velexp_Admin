import { GET_PICKUP_PERFORMANCE } from "@/api";
import formatDateForPayload from "@/helpers/DateHelper";

const MODE_OPTIONS = [
  { label: "forward", value: "forward" },
  { label: "reverse", value: "reverse" },
];

/**
 * Pickup Performance — the canonical instance of the report template.
 *
 * Ported from the 550-line pages/Dashboard/Reports/PickupPeformance.jsx. It
 * exercises every filter type the engine supports (single select, multi
 * select, static options, date range), which is why it is the second pilot.
 *
 * Reuses formatDateForPayload rather than date-fns `format`: it returns
 * { from_date, to_date } and, critically, empty strings when either end of the
 * range is unset. Substituting a different formatter would change the request
 * body for an unset range.
 *
 * The table shows 18 columns; the spreadsheet has 25. The extra seven --
 * Vendor Pincode, RTO AWB No, Destination, Freight Charges, Invoice No,
 * TAT (Days), Delivery Attempts -- are exported but never displayed.
 *
 * @type {import("../engine/types").ReportConfig}
 */
export const pickupPerformance = {
  key: "pickup-performance",
  title: "Pickup Performance",
  endpoint: GET_PICKUP_PERFORMANCE,
  loadingText: "Loading Pickup Performance ...",
  select: (res) => res?.bookings ?? [],

  filters: [
    { name: "serviceCenter", type: "multiSelect", label: "Select Service Center", source: "serviceCenters", span: 6 },
    { name: "region", type: "multiSelect", label: "Select Region", source: "regions", span: 6 },
    { name: "dateRange", type: "dateRange", label: "Select Date Range", required: true, span: 3 },
    { name: "customer", type: "select", label: "Customer", source: "customers", placeholder: "Search Customer", span: 3 },
    { name: "mode", type: "select", label: "Select Mode", options: MODE_OPTIONS, placeholder: "Search Mode", span: 3 },
    { name: "product", type: "select", label: "Select Product", source: "products", placeholder: "Search Product", span: 3 },
  ],

  buildPayload: (f) => {
    const d = formatDateForPayload(f.dateRange ?? { startDate: "", endDate: "" });
    return {
      customer_name: f.customer?.value ? f.customer.value : "All",
      start_date: d.from_date,
      end_date: d.to_date,
      service_center: (f.serviceCenter ?? []).map((x) => x?.value) || [],
      product: f.product?.value || "",
      mode: f.mode?.value || "",
      region: (f.region ?? []).map((x) => x?.value) || [],
    };
  },

  columns: [
    { header: "Customer Name", key: "customer_name" },
    { header: "Awb Date", key: "awbdate", size: 150 },
    { header: "AWB No.", key: "awbno" },
    { header: "Order No.", key: "orderno" },
    { header: "Reference", key: "ref2" },
    { header: "Consignee Name", key: "consignee_name" },
    { header: "City", key: "consignee_city" },
    { header: "State", key: "consignee_state" },
    { header: "Pincode", key: "billing_pincode" },
    { header: "ORGSC", key: "orgsc" },
    { header: "Vendor Name", key: "vendor_name" },
    { header: "Service Center", key: "service_center" },
    { header: "Checkpnt", key: "CHKPNT" },
    { header: "Qty", key: "quantity" },
    { header: "Weight", key: "weight" },
    { header: "Shipment Value", key: "shipment_value" },
    { header: "Total Amount", key: "total_amount" },
    { header: "Payment Mode", key: "paymentmode" },
  ],

  export: {
    fileName: "PickUpPerformance",
    // 25 columns against 18 on screen, and a different order from the table.
    columns: [
      { header: "AWB No", key: "awbno" },
      { header: "AWB Date", key: "awbdate" },
      { header: "Order No", key: "orderno" },
      { header: "Reference No", key: "ref2" },
      { header: "Customer Name", key: "customer_name" },
      { header: "Consignee Name", key: "consignee_name" },
      { header: "Consignee City", key: "consignee_city" },
      { header: "Consignee State", key: "consignee_state" },
      { header: "Billing Pincode", key: "billing_pincode" },
      { header: "Origin SC", key: "orgsc" },
      { header: "Service Center", key: "service_center" },
      { header: "Vendor Name", key: "vendor_name" },
      { header: "Vendor Pincode", key: "vendor_pincode" },
      { header: "Quantity", key: "quantity" },
      { header: "Weight", key: "weight" },
      { header: "Shipment Value", key: "shipment_value" },
      { header: "Total Amount", key: "total_amount" },
      { header: "Payment Mode", key: "paymentmode" },
      { header: "RTO AWB No", key: "rtoawbno" },
      { header: "Destination", key: "destination" },
      { header: "Freight Charges", key: "tot_freight" },
      { header: "Invoice No", key: "invno" },
      { header: "Checkpoint", key: "CHKPNT" },
      { header: "TAT (Days)", key: "tat_days" },
      { header: "Delivery Attempts", key: "attempts" },
    ],
  },
};
