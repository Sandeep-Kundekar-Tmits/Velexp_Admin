import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ BASE_URL: "https://api.test", SECRET_KEY: "x" }));

const { pickupPerformance } = await import("@/features/reports/configs/pickupPerformance");
const { exportHeaders, makeRowMapper } = await import("@/features/reports/engine/reportExport");
const baseline = (await import("./baseline/reports.json")).default;

const legacy = baseline.find((r) => r.file.endsWith("Reports/PickupPeformance.jsx"));

const RANGE = { startDate: new Date(2026, 0, 15), endDate: new Date(2026, 1, 3) };

describe("pickupPerformance payload matches the legacy screen", () => {
  it("targets GET_PICKUP_PERFORMANCE", () => {
    expect(legacy.endpoints).toContain("GET_PICKUP_PERFORMANCE");
  });

  it("sends the same 7 keys in the same order", () => {
    const payload = pickupPerformance.buildPayload({ dateRange: RANGE });
    expect(Object.keys(payload)).toEqual(legacy.payloads[0].pairs.map((p) => p.key));
  });

  it("formats dates DD-MM-YYYY via the shared helper", () => {
    const p = pickupPerformance.buildPayload({ dateRange: RANGE });
    expect(p.start_date).toBe("15-01-2026");
    expect(p.end_date).toBe("03-02-2026");
  });

  it("returns empty date strings when the range is unset", () => {
    // formatDateForPayload returns "" for an unset range; a different
    // formatter would send a different body for the same user state.
    const p = pickupPerformance.buildPayload({});
    expect(p.start_date).toBe("");
    expect(p.end_date).toBe("");
  });

  it('defaults customer_name to "All"', () => {
    expect(pickupPerformance.buildPayload({ dateRange: RANGE }).customer_name).toBe("All");
  });

  it("sends empty arrays, not undefined, for unset multi-selects", () => {
    // JSON.stringify drops undefined keys entirely, so [] vs undefined are
    // genuinely different request bodies.
    const p = pickupPerformance.buildPayload({ dateRange: RANGE });
    expect(p.service_center).toEqual([]);
    expect(p.region).toEqual([]);
  });

  it("sends empty strings for unset single selects", () => {
    const p = pickupPerformance.buildPayload({ dateRange: RANGE });
    expect(p.product).toBe("");
    expect(p.mode).toBe("");
  });

  it("maps selected values through to plain arrays and scalars", () => {
    const p = pickupPerformance.buildPayload({
      dateRange: RANGE,
      customer: { value: "ACME" },
      serviceCenter: [{ value: "BLR" }, { value: "DEL" }],
      region: [{ value: "North" }],
      product: { value: "Express" },
      mode: { value: "forward" },
    });
    expect(p).toEqual({
      customer_name: "ACME",
      start_date: "15-01-2026",
      end_date: "03-02-2026",
      service_center: ["BLR", "DEL"],
      product: "Express",
      mode: "forward",
      region: ["North"],
    });
  });
});

describe("pickupPerformance export matches the legacy screen", () => {
  it("exports the same 25 headers in the same order", () => {
    expect(exportHeaders(pickupPerformance)).toEqual(legacy.exports[0].headers);
  });

  it("uses the same filename", () => {
    expect(pickupPerformance.export.fileName).toBe(legacy.exports[0].fileName);
  });

  it("exports 7 fields that have no column on screen", () => {
    // Compare by source FIELD, not header text: the two lists deliberately use
    // different wording for the same data ("AWB No." vs "AWB No", "Awb Date"
    // vs "AWB Date", "ORGSC" vs "Origin SC"), so a header-name diff would
    // wrongly report renamed columns as extra ones.
    const shownKeys = new Set(pickupPerformance.columns.map((c) => c.key));
    const extra = pickupPerformance.export.columns
      .filter((c) => !shownKeys.has(c.key))
      .map((c) => c.key);
    expect(extra).toEqual([
      "vendor_pincode",
      "rtoawbno",
      "destination",
      "tot_freight",
      "invno",
      "tat_days",
      "attempts",
    ]);
  });

  it("uses different header wording from the table for shared fields", () => {
    // Documents a real divergence: the same field is labelled differently on
    // screen and in the spreadsheet. Both are preserved verbatim.
    const byKey = Object.fromEntries(pickupPerformance.columns.map((c) => [c.key, c.header]));
    const exportByKey = Object.fromEntries(
      pickupPerformance.export.columns.filter((c) => c.key).map((c) => [c.key, c.header])
    );
    expect(byKey.awbno).toBe("AWB No.");
    expect(exportByKey.awbno).toBe("AWB No");
    expect(byKey.orgsc).toBe("ORGSC");
    expect(exportByKey.orgsc).toBe("Origin SC");
  });

  it("maps every export column to the same source field as the legacy code", () => {
    // Legacy fields look like `item?.awbno`; compare the trailing property.
    const row = Object.fromEntries(
      legacy.exports[0].fields.map((f, i) => [f.split(/[?.]+/).pop(), `v${i}`])
    );
    const mapped = makeRowMapper(pickupPerformance)(row);
    legacy.exports[0].headers.forEach((h, i) => {
      const field = legacy.exports[0].fields[i].split(/[?.]+/).pop();
      expect(mapped[h], `${h} should read ${field}`).toBe(row[field]);
    });
  });
});
