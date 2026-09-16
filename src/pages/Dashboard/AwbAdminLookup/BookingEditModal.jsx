import { useEffect, useMemo, useState } from "react"
import PropTypes from "prop-types"
import axios from "axios"
import {
    Alert, Button, FormFeedback, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader,
    Nav, NavItem, NavLink, Spinner, TabContent, TabPane,
} from "@/components/ui"
import { AWB_ADMIN_BOOKING_CORRECTION } from "../../../api"
import { VOLUMETRIC_WEIGHT_DIVISOR } from "@/config/env"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { EDITABLE_GROUPS } from "./fieldGroups"

const DIMENSION_KEYS = ["length", "breadth", "height"]

const calcVolumetricWeight = (values) => {
    const l = parseFloat(values.length), b = parseFloat(values.breadth), h = parseFloat(values.height)
    if (!l || !b || !h) return null
    return ((l * b * h) / VOLUMETRIC_WEIGHT_DIVISOR).toFixed(2)
}

// Same defensive extraction TrackingCorrection.jsx uses for error bodies -- the API doc
// doesn't nail down one exact shape.
const extractErrorMessage = (data) => {
    if (!data) return null
    if (typeof data === "string") return data
    return data.message || data.detail || data.error || data.msg || null
}

const toFormValue = (raw, type) => {
    if (raw === null || raw === undefined) return type === "boolean" ? "" : ""
    if (type === "boolean") return raw ? "true" : "false"
    if (type === "date") return String(raw).slice(0, 10)
    return String(raw)
}

const fromFormValue = (value, type) => {
    if (type === "boolean") return value === "" ? null : value === "true"
    if (type === "number") return value === "" ? null : Number(value)
    return value
}

const BookingEditModal = ({ isOpen, booking, editableFields, onClose, onSaved }) => {
    const { ErrorToaster } = ToasterProvider()

    // Only offer groups/fields the lookup actually said are editable -- the API doc notes
    // this list is also returned live so the form can drive off it instead of a hardcoded copy.
    const groups = useMemo(() => {
        if (!editableFields || editableFields.length === 0) return EDITABLE_GROUPS
        const allowed = new Set(editableFields)
        return EDITABLE_GROUPS
            .map((g) => ({ ...g, fields: g.fields.filter((f) => allowed.has(f.key)) }))
            .filter((g) => g.fields.length > 0)
    }, [editableFields])

    const fieldByKey = useMemo(() => {
        const map = {}
        groups.forEach((g) => g.fields.forEach((f) => { map[f.key] = f }))
        return map
    }, [groups])

    const [activeGroup, setActiveGroup] = useState(groups[0]?.title)
    const [values, setValues] = useState({})
    const [remark, setRemark] = useState("")
    const [touched, setTouched] = useState(false)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (!isOpen || !booking) return
        const initial = {}
        groups.forEach((g) => g.fields.forEach((f) => { initial[f.key] = toFormValue(booking[f.key], f.type) }))
        setValues(initial)
        setRemark("")
        setTouched(false)
        setActiveGroup(groups[0]?.title)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, booking])

    // Volumetric weight is derived, not typed in -- recompute it only when a dimension the
    // admin is actively editing changes, not on the initial prefill from `booking` (that
    // would overwrite the stored value with a freshly-rounded one on every open, producing
    // a spurious "changed" field even when nothing was actually edited).
    const setField = (key, rawValue) => setValues((prev) => {
        const rule = fieldByKey[key]?.rule
        let value = rawValue
        if (rule?.numericOnly) value = value.replace(/\D/g, "")
        if (rule?.maxLength) value = value.slice(0, rule.maxLength)

        const next = { ...prev, [key]: value }
        if (DIMENSION_KEYS.includes(key)) {
            const computed = calcVolumetricWeight(next)
            if (computed !== null) next.volumetric_weight = computed
        }
        return next
    })

    const changedFields = useMemo(() => {
        if (!booking) return {}
        const out = {}
        groups.forEach((g) => g.fields.forEach((f) => {
            const before = toFormValue(booking[f.key], f.type)
            const after = values[f.key] ?? ""
            if (before !== after) out[f.key] = fromFormValue(after, f.type)
        }))
        return out
    }, [values, booking, groups])

    // Format rules only apply to fields the admin actually touched -- pre-existing legacy
    // values sitting untouched in other fields shouldn't block a save.
    const fieldErrors = useMemo(() => {
        const errors = {}
        Object.keys(changedFields).forEach((key) => {
            const rule = fieldByKey[key]?.rule
            const raw = (values[key] ?? "").toString().trim()
            if (!rule || raw === "") return
            if (rule.pattern && !rule.pattern.test(raw)) errors[key] = rule.message
        })
        return errors
    }, [changedFields, values, fieldByKey])

    const changedCount = Object.keys(changedFields).length
    const errorCount = Object.keys(fieldErrors).length
    const remarkError = touched && !remark.trim() ? "Remark is required" : ""
    const noChanges = touched && changedCount === 0 ? "Change at least one field" : ""

    const handleSubmit = async () => {
        setTouched(true)
        if (!remark.trim()) { ErrorToaster("Remark is required"); return }
        if (changedCount === 0) { ErrorToaster("Change at least one field before saving"); return }
        if (errorCount > 0) { ErrorToaster("Fix the highlighted fields before saving"); return }

        setSubmitting(true)
        try {
            const res = await axios.post(AWB_ADMIN_BOOKING_CORRECTION, {
                awbno: booking.awbno,
                remark: remark.trim(),
                fields: changedFields,
            }, {
                headers: { "Content-Type": "application/json" },
                withCredentials: true,
            })
            const data = res.data || {}
            onSaved(data)
        } catch (err) {
            ErrorToaster(extractErrorMessage(err.response?.data) || "Failed to save booking correction")
        } finally {
            setSubmitting(false)
        }
    }

    if (!booking) return null

    return (
        <Modal isOpen={isOpen} toggle={() => !submitting && onClose()} centered size="xl" scrollable>
            <ModalHeader toggle={() => !submitting && onClose()}>
                Edit Booking — {booking.awbno}
            </ModalHeader>
            <ModalBody>
                <Nav tabs className="mb-3 flex-wrap">
                    {groups.map((g) => (
                        <NavItem key={g.title}>
                            <NavLink active={activeGroup === g.title} onClick={() => setActiveGroup(g.title)} style={{ cursor: "pointer" }}>
                                {g.title}
                            </NavLink>
                        </NavItem>
                    ))}
                </Nav>

                <TabContent activeTab={activeGroup}>
                    {groups.map((g) => (
                        <TabPane tabId={g.title} key={g.title}>
                            {activeGroup === g.title && (
                                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                                    {g.fields.map((f) => {
                                        const fieldError = touched && fieldErrors[f.key]
                                        return (
                                        <div key={f.key} className={f.type === "textarea" ? "sm:col-span-2" : ""}>
                                            <Label className="text-xs font-semibold">{f.label}{f.computed && " (auto)"}</Label>
                                            {f.computed ? (
                                                <Input type="number" value={values[f.key] ?? ""} disabled readOnly />
                                            ) : f.type === "select" ? (
                                                <Input type="select" value={values[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)}>
                                                    {f.options.map((o) => <option key={o || "none"} value={o}>{o || "— none —"}</option>)}
                                                </Input>
                                            ) : f.type === "boolean" ? (
                                                <Input type="select" value={values[f.key] ?? ""} onChange={(e) => setField(f.key, e.target.value)}>
                                                    <option value="true">Yes</option>
                                                    <option value="false">No</option>
                                                </Input>
                                            ) : (
                                                <Input
                                                    type={f.type === "textarea" ? "textarea" : f.type === "date" ? "date" : f.type === "number" ? "number" : "text"}
                                                    rows={f.type === "textarea" ? 2 : undefined}
                                                    maxLength={f.rule?.maxLength}
                                                    inputMode={f.rule?.numericOnly ? "numeric" : undefined}
                                                    invalid={!!fieldError}
                                                    value={values[f.key] ?? ""}
                                                    onChange={(e) => setField(f.key, e.target.value)}
                                                />
                                            )}
                                            {fieldError && <FormFeedback className="block">{fieldError}</FormFeedback>}
                                            {f.hint && <div className="mt-1 text-[11px] text-ink-muted">{f.hint}</div>}
                                        </div>
                                        )
                                    })}
                                </div>
                            )}
                        </TabPane>
                    ))}
                </TabContent>

                {noChanges && <Alert color="warning" className="mt-4 py-2 text-xs">{noChanges}</Alert>}
                {touched && errorCount > 0 && (
                    <Alert color="danger" className="mt-4 py-2 text-xs">Fix {errorCount} field(s) with invalid values before saving.</Alert>
                )}
                {changedCount > 0 && (
                    <div className="mt-4 text-xs text-ink-muted">{changedCount} field(s) changed.</div>
                )}

                <div className="mt-2">
                    <Label className="font-bold">Remark (required)</Label>
                    <Input
                        type="textarea"
                        rows={2}
                        invalid={!!remarkError}
                        placeholder="Why is this being corrected?"
                        value={remark}
                        onChange={(e) => setRemark(e.target.value)}
                    />
                    {remarkError && <FormFeedback className="block">{remarkError}</FormFeedback>}
                </div>
            </ModalBody>
            <ModalFooter>
                <Button color="secondary" outline onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button color="primary" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? <Spinner size="sm" /> : "Save Correction"}
                </Button>
            </ModalFooter>
        </Modal>
    )
}

BookingEditModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    booking: PropTypes.object,
    editableFields: PropTypes.array,
    onClose: PropTypes.func.isRequired,
    onSaved: PropTypes.func.isRequired,
}

export default BookingEditModal
