import { describe, expect, it, vi } from "vitest";

vi.mock("@/config/env", () => ({ BASE_URL: "https://api.test", SECRET_KEY: "x" }));
vi.mock("@/helpers/tokenRefresh", () => ({
  getAccessToken: () => null,
  isAuthExemptUrl: () => false,
  refreshAccessToken: vi.fn(),
}));

const {
  toCustomerOptions,
  toProductOptions,
  toRegionOptions,
  toServiceCenterOptions,
} = await import("@/services/reference.service");

const { qk } = await import("@/lib/queryKeys");

describe("toCustomerOptions", () => {
  it("maps rows to { value, label }", () => {
    expect(toCustomerOptions([{ customer_name: "ACME" }])).toEqual([
      { value: "ACME", label: "ACME" },
    ]);
  });

  it('drops the literal strings "null" and "undefined" from upstream serialization', () => {
    const rows = [
      { customer_name: "ACME" },
      { customer_name: "null" },
      { customer_name: "undefined" },
    ];
    expect(toCustomerOptions(rows).map((o) => o.value)).toEqual(["ACME"]);
  });

  it("drops empty, whitespace-only and missing names", () => {
    const rows = [{ customer_name: "" }, { customer_name: "   " }, {}, { customer_name: "Nova" }];
    expect(toCustomerOptions(rows).map((o) => o.value)).toEqual(["Nova"]);
  });

  it("tolerates null/undefined input", () => {
    expect(toCustomerOptions(null)).toEqual([]);
    expect(toCustomerOptions(undefined)).toEqual([]);
  });
});

describe("toRegionOptions", () => {
  it("collapses case-variant duplicates, keeping the first spelling", () => {
    const rows = [{ region: "North" }, { region: "NORTH" }, { region: "north" }, { region: "West" }];
    expect(toRegionOptions(rows)).toEqual([
      { value: "North", label: "North" },
      { value: "West", label: "West" },
    ]);
  });

  it("skips rows with no region", () => {
    expect(toRegionOptions([{ region: "" }, {}, { region: "East" }])).toEqual([
      { value: "East", label: "East" },
    ]);
  });
});

describe("toServiceCenterOptions / toProductOptions", () => {
  it("maps ec_code and name respectively", () => {
    expect(toServiceCenterOptions([{ ec_code: "BLR" }])).toEqual([
      { value: "BLR", label: "BLR" },
    ]);
    expect(toProductOptions([{ name: "Express" }])).toEqual([
      { value: "Express", label: "Express" },
    ]);
  });

  it("tolerates null input", () => {
    expect(toServiceCenterOptions(null)).toEqual([]);
    expect(toProductOptions(null)).toEqual([]);
  });
});

describe("query keys", () => {
  it("are stable and prefix-scoped so invalidation works", () => {
    expect(qk.reference.customers()).toEqual(["reference", "customers"]);
    expect(qk.reference.customers().slice(0, 1)).toEqual(qk.reference.all);
  });

  it("key report results by their filter payload", () => {
    const a = qk.reports.result("pickup", { from: "01-01-2026" });
    const b = qk.reports.result("pickup", { from: "02-01-2026" });
    expect(a).not.toEqual(b);
    expect(a.slice(0, 2)).toEqual(qk.reports.byKey("pickup"));
  });
});
