// The fields of one billing address (corporate customers). Used by the Add customer form and by the onboarding
// "Billing address" step, so both look and validate the same. Rules follow the API: address, city, state and a
// 6 digit pincode are required; GSTIN is optional but, when given, must be 15 characters (the server also checks
// that its first two digits match the state).
import { useMemo } from "react"
import PropTypes from "prop-types"
import Select from "react-select"
import { Col, FormFeedback, FormGroup, Input, Label, Row } from "@/components/ui"
import locations from "../../data/locations.json"
import { customStyles } from "../../helpers/CustomStyle"

export const EMPTY_BILLING = {
    label: "", legal_name: "", gst_no: "", address: "", city: "", state: "", pincode: "",
    contact_name: "", contact_phone: "", contact_email: "", is_default: true,
}

const GSTIN = /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/

// { field: message } for the first problem on each field; {} when the address is fine
export const validateBilling = (b) => {
    const e = {}
    if (!String(b.address || "").trim()) e.address = "Address is required"
    if (!String(b.city || "").trim()) e.city = "City is required"
    if (!String(b.state || "").trim()) e.state = "State is required"
    if (!/^\d{6}$/.test(String(b.pincode || "").trim())) e.pincode = "Pincode must be 6 digits"
    const gst = String(b.gst_no || "").trim().toUpperCase()
    if (gst && !GSTIN.test(gst)) e.gst_no = "Enter a valid 15 character GSTIN"
    const mail = String(b.contact_email || "").trim()
    if (mail && !/^\S+@\S+\.\S+$/.test(mail)) e.contact_email = "Enter a valid email"
    const phone = String(b.contact_phone || "").trim()
    if (phone && !/^\d{10}$/.test(phone)) e.contact_phone = "Phone must be 10 digits"
    return e
}

// the request body for one address: blanks left out, GSTIN upper-cased
export const billingBody = (b) => {
    const out = {}
    Object.entries(b).forEach(([k, v]) => {
        if (k === "is_default") { out[k] = !!v; return }
        const t = String(v ?? "").trim()
        if (t) out[k] = k === "gst_no" ? t.toUpperCase() : t
    })
    return out
}

const BillingAddressFields = ({ value, onChange, errors = {}, disabled = false }) => {
    const states = useMemo(() => locations.map((l) => ({ value: l.state, label: l.state })), [])
    const set = (k) => (e) => onChange({ [k]: e.target.value })
    const field = (label, k, { required = false, md = 4, props = {} } = {}) => (
        <Col md={md}>
            <FormGroup>
                <Label>{label}{required && <span className="text-danger-500"> *</span>}</Label>
                <Input name={k} value={value[k] || ""} onChange={set(k)} invalid={!!errors[k]} disabled={disabled} {...props} />
                {errors[k] && <FormFeedback className="block">{errors[k]}</FormFeedback>}
            </FormGroup>
        </Col>
    )
    return (
        <Row>
            {field("Label", "label", { props: { placeholder: "Head office" } })}
            {field("Legal name", "legal_name")}
            {field("GST number", "gst_no", { props: { maxLength: 15, onChange: (e) => onChange({ gst_no: e.target.value.toUpperCase() }) } })}
            <Col md={12}>
                <FormGroup>
                    <Label>Address<span className="text-danger-500"> *</span></Label>
                    <Input type="textarea" rows={2} name="address" value={value.address || ""} onChange={set("address")} invalid={!!errors.address} disabled={disabled} />
                    {errors.address && <FormFeedback className="block">{errors.address}</FormFeedback>}
                </FormGroup>
            </Col>
            <Col md={4}>
                <FormGroup>
                    <Label>State<span className="text-danger-500"> *</span></Label>
                    <Select
                        options={states}
                        value={value.state ? { value: value.state, label: value.state } : null}
                        onChange={(o) => onChange({ state: o?.value || "" })}
                        placeholder="Select state"
                        styles={customStyles}
                        isDisabled={disabled}
                        menuPortalTarget={document.body}
                        menuPosition="fixed"
                    />
                    {errors.state && <small className="text-danger-500">{errors.state}</small>}
                </FormGroup>
            </Col>
            {field("City", "city", { required: true })}
            {field("Pincode", "pincode", { required: true, props: { maxLength: 6, inputMode: "numeric" } })}
            {field("Contact name", "contact_name")}
            {field("Contact phone", "contact_phone", { props: { maxLength: 10, inputMode: "numeric" } })}
            {field("Contact email", "contact_email")}
        </Row>
    )
}

BillingAddressFields.propTypes = {
    value: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    errors: PropTypes.object,
    disabled: PropTypes.bool,
}

export default BillingAddressFields
