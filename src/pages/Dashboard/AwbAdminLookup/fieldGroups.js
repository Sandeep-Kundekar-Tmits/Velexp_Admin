import { VOLUMETRIC_WEIGHT_DIVISOR } from "@/config/env"

// Per-field format rules, checked only when that field is actually edited (pre-existing
// legacy values in untouched fields are left alone). `numericOnly` strips non-digit
// characters as the admin types, `maxLength` caps input length, `pattern` is the final
// accept/reject check on submit.
const PHONE_RULE = { numericOnly: true, maxLength: 10, pattern: /^\d{10}$/, message: "Enter a valid 10-digit phone number" }
const PINCODE_RULE = { numericOnly: true, maxLength: 6, pattern: /^\d{6}$/, message: "Enter a valid 6-digit pincode" }
const EMAIL_RULE = { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: "Enter a valid email address" }
const GST_RULE = { maxLength: 15, pattern: /^[0-9]{2}[A-Z0-9]{10}[A-Z0-9]{3}$/i, message: "Enter a valid 15-character GST number" }

// The exact set POST .../booking-correction/ accepts in `fields` -- anything else comes
// back as a 400. Grouped the same way the API doc groups them, so both the read-only
// booking display and the edit form can walk the same list instead of two hand-kept ones.
export const EDITABLE_GROUPS = [
    {
        title: "Shipper",
        fields: [
            { key: "pick_name", label: "Name" },
            { key: "pick_phoneno", label: "Phone", rule: PHONE_RULE },
            { key: "pick_altphoneno", label: "Alt Phone", rule: PHONE_RULE },
            { key: "pick_email", label: "Email", rule: EMAIL_RULE },
            { key: "pick_address", label: "Address", type: "textarea" },
            { key: "pick_landmark", label: "Landmark" },
            { key: "pick_city", label: "City" },
            { key: "pick_state", label: "State" },
            { key: "pick_pincode", label: "Pincode", rule: PINCODE_RULE },
            { key: "pick_gstno", label: "GST No", rule: GST_RULE },
        ],
    },
    {
        title: "Consignee",
        fields: [
            { key: "drop_name", label: "Name" },
            { key: "drop_phoneno", label: "Phone", rule: PHONE_RULE },
            { key: "drop_altphoneno", label: "Alt Phone", rule: PHONE_RULE },
            { key: "drop_phone_extension_code", label: "Phone Ext. Code" },
            { key: "drop_email", label: "Email", rule: EMAIL_RULE },
            { key: "drop_address", label: "Address", type: "textarea" },
            { key: "drop_landmark", label: "Landmark" },
            { key: "drop_city", label: "City" },
            { key: "drop_state", label: "State" },
            { key: "drop_pincode", label: "Pincode", rule: PINCODE_RULE },
        ],
    },
    {
        title: "Weight & Dimensions",
        fields: [
            { key: "weight", label: "Weight", type: "number" },
            { key: "quantity", label: "Quantity", type: "number" },
            { key: "length", label: "Length", type: "number" },
            { key: "breadth", label: "Breadth", type: "number" },
            { key: "height", label: "Height", type: "number" },
            {
                key: "volumetric_weight", label: "Volumetric Weight", type: "number", computed: true,
                hint: `Auto-calculated as (Length × Breadth × Height) ÷ ${VOLUMETRIC_WEIGHT_DIVISOR} — not directly editable.`,
            },
        ],
    },
    {
        title: "Pricing & COD",
        fields: [
            { key: "shipment_value", label: "Shipment Value", type: "number" },
            { key: "rate", label: "Rate", type: "number" },
            { key: "gst", label: "GST", type: "number" },
            { key: "FOV", label: "FOV", type: "number" },
            { key: "FSC", label: "FSC", type: "number" },
            { key: "pickup_charge", label: "Pickup Charge", type: "number" },
            { key: "payment_mode", label: "Payment Mode" },
            {
                key: "cod_amount", label: "COD Amount", type: "number",
                hint: "Reset to 0 by the backend unless Payment Mode is COD in this same submission.",
            },
            { key: "payment_status", label: "Payment Status" },
            { key: "payment_option", label: "Payment Option" },
            { key: "total_amount", label: "Total Amount", type: "number" },
            { key: "discount_percent", label: "Discount %", type: "number" },
            { key: "total_amount_paid", label: "Total Amount Paid", type: "number" },
            { key: "pop_amount", label: "POP Amount", type: "number" },
            { key: "to_pay", label: "To Pay", type: "number" },
            { key: "insurance", label: "Insurance" },
        ],
    },
    {
        title: "Status & Flags",
        fields: [
            { key: "status", label: "Status" },
            { key: "reason", label: "Reason" },
            {
                key: "shipment_flag", label: "Shipment Flag", type: "select",
                options: ["", "RTS_PENDING", "RTO_APPROVAL", "WRONG_AWB", "PRIORITY"],
            },
            { key: "flag_remark", label: "Flag Remark" },
            { key: "rts_pending", label: "RTS Pending", type: "boolean" },
        ],
    },
    {
        title: "Pickup & Delivery",
        fields: [
            { key: "pickup_date", label: "Pickup Date", type: "date" },
            { key: "pickup_fromtime", label: "Pickup From Time" },
            { key: "pickup_totime", label: "Pickup To Time" },
            { key: "delivery_attempts", label: "Delivery Attempts", type: "number" },
            { key: "delivery_appointment", label: "Delivery Appointment" },
            { key: "delivery_option", label: "Delivery Option" },
            { key: "awb_date", label: "AWB Date", type: "date" },
            { key: "EDD", label: "EDD", type: "date", hint: "Never recomputed automatically -- set explicitly if it needs to change." },
        ],
    },
    {
        title: "RTO",
        fields: [
            { key: "RTO_vendorname", label: "Vendor Name" },
            { key: "RTO_vendoraddress", label: "Vendor Address", type: "textarea" },
            { key: "RTO_vendorpincode", label: "Vendor Pincode", rule: PINCODE_RULE },
            { key: "RTO_vendorcontactno", label: "Vendor Contact", rule: PHONE_RULE },
            { key: "RTO_awbno", label: "RTO AWB No" },
        ],
    },
    {
        title: "Other",
        fields: [
            { key: "customer_code", label: "Customer Code" },
            { key: "customer_name", label: "Customer Name" },
            { key: "service_type", label: "Service Type" },
            { key: "customer_ref_no", label: "Customer Ref No" },
            { key: "product_description", label: "Product Description" },
            { key: "product_type", label: "Product Type" },
            { key: "ewaybill_no", label: "E-way Bill No" },
            { key: "utr_number", label: "UTR Number" },
            { key: "deposit_date", label: "Deposit Date", type: "date" },
            { key: "utr_remark", label: "UTR Remark" },
        ],
    },
]

export const EDITABLE_FIELD_KEYS = EDITABLE_GROUPS.flatMap((g) => g.fields.map((f) => f.key))

export const humanizeKey = (key) =>
    key
        .replace(/_/g, " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
        .replace(/\bId\b/g, "ID")
        .replace(/\bRto\b/g, "RTO")
        .replace(/\bGst\b/g, "GST")
        .replace(/\bAwb\b/g, "AWB")
