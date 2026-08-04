import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ BASE_URL: "https://api.test", SECRET_KEY: "x" }));

const { codReport } = await import("@/features/reports/configs/codReport");
const { exportHeaders, makeRowMapper } = await import("@/features/reports/engine/reportExport");
const baseline = (await import("./baseline/reports.json")).default;

const legacy = baseline.find((r) => r.file.endsWith("Reports/CODReport.jsx"));

describe("codReport config matches the legacy screen", () => {
  it("targets the same endpoint", () => {
    expect(legacy.endpoints).toContain("COD_UPLOAD_REPORTS");
  });

  it("sends the same payload keys in the same order", () => {
    const payload = codReport.buildPayload({
      dateRange: { startDate: new Date(2026, 0, 15), endDate: new Date(2026, 0, 31) },
      customer: { value: "ACME", label: "ACME-acme_user" },
    });
    expect(Object.keys(payload)).toEqual(legacy.payloads[0].pairs.map((p) => p.key));
  });

  it("formats dates as dd-MM-yyyy", () => {
    const payload = codReport.buildPayload({
      dateRange: { startDate: new Date(2026, 0, 15), endDate: new Date(2026, 1, 3) },
    });
    expect(payload.start_date).toBe("15-01-2026");
    expect(payload.end_date).toBe("03-02-2026");
  });

  it('defaults customer_name to "All" when none is selected', () => {
    const payload = codReport.buildPayload({
      dateRange: { startDate: new Date(2026, 0, 1), endDate: new Date(2026, 0, 2) },
    });
    expect(payload.customer_name).toBe("All");
  });

  it("emits empty date strings rather than undefined when unset", () => {
    // The legacy screen sends "", and "" vs a missing key are different
    // request bodies once JSON.stringify drops undefined values.
    const payload = codReport.buildPayload({});
    expect(payload.start_date).toBe("");
    expect(payload.end_date).toBe("");
  });

  it("exports the same 12 headers in the same order", () => {
    expect(exportHeaders(codReport)).toEqual(legacy.exports[0].headers);
  });

  it("exports to the same filename", () => {
    expect(codReport.export.fileName).toBe(legacy.exports[0].fileName);
  });

  it("exports two columns that are not shown on screen", () => {
    const shown = codReport.columns.map((c) => c.header);
    const exported = exportHeaders(codReport);
    expect(exported.filter((h) => !shown.includes(h))).toEqual([
      "Payment Mode",
      "Consignee State",
    ]);
  });
});

describe("codReport row mapping", () => {
  const row = {
    awbno: "8829110",
    pick_pincode: "560001",
    drop_pincode: "110001",
    weight: 1.4,
    shipment_value: 2500,
    paymentmode: "COD",
    customer_name: "ACME",
    orgsc: "BLR",
    consignee_city: "Delhi",
    consignee_state: "DL",
    date: "15-01-2026",
    cod_amount: 2500,
  };

  it("maps a row to the exact exported shape", () => {
    const mapped = makeRowMapper(codReport)(row);
    expect(Object.keys(mapped)).toEqual(legacy.exports[0].headers);
    expect(mapped["AWB No"]).toBe("8829110");
    expect(mapped["Payment Mode"]).toBe("COD");
    expect(mapped["Consignee State"]).toBe("DL");
  });

  it("reformats the date the way the legacy export did", () => {
    // dd-MM-yyyy -> "15 Jan 2026" (en-IN, 2-digit day, short month)
    expect(makeRowMapper(codReport)(row)["Date"]).toMatch(/15 Jan 2026/);
  });

  it('renders a missing date as "N/A"', () => {
    expect(makeRowMapper(codReport)({ ...row, date: null })["Date"]).toBe("N/A");
  });

  it("coerces null numerics to 0, matching the legacy ?? 0", () => {
    const mapped = makeRowMapper(codReport)({ ...row, weight: null, cod_amount: null });
    expect(mapped["Weight (Kg)"]).toBe(0);
    expect(mapped["COD Amount"]).toBe(0);
  });
});
