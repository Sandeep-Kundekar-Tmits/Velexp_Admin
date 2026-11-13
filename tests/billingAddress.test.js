import { describe, expect, it } from "vitest"
import { EMPTY_BILLING, billingBody, validateBilling } from "../src/components/UserManagement/BillingAddressFields"

const ok = { ...EMPTY_BILLING, address: "1 Test Road", city: "Mumbai", state: "Maharashtra", pincode: "400001" }

describe("billing address", () => {
    it("accepts the four required fields", () => {
        expect(validateBilling(ok)).toEqual({})
    })
    it("flags missing required fields and a bad pincode", () => {
        const e = validateBilling({ ...EMPTY_BILLING, pincode: "123" })
        expect(Object.keys(e).sort()).toEqual(["address", "city", "pincode", "state"])
    })
    it("checks GSTIN, phone and email only when given", () => {
        expect(validateBilling({ ...ok, gst_no: "27ABCDE1234F1Z5", contact_phone: "9800000000", contact_email: "a@b.com" })).toEqual({})
        const e = validateBilling({ ...ok, gst_no: "BAD", contact_phone: "12", contact_email: "x" })
        expect(Object.keys(e).sort()).toEqual(["contact_email", "contact_phone", "gst_no"])
    })
    it("drops blanks and upper-cases the GSTIN in the body", () => {
        expect(billingBody({ ...ok, gst_no: "27abcde1234f1z5", is_default: true })).toEqual({
            address: "1 Test Road", city: "Mumbai", state: "Maharashtra", pincode: "400001", gst_no: "27ABCDE1234F1Z5", is_default: true,
        })
    })
})
