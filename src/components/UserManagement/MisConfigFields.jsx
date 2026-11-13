// Daily MIS (delivery summary) settings for a new Corporate customer: who receives it and at what time.
// Sent as mis_config { emails: [...], schedule_time: "HH:MM" }. The MIS only starts at go-live.
import { useState } from "react"
import PropTypes from "prop-types"
import { Col, FormGroup, Input, Label, Row } from "@/components/ui"

const EMAIL = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export const EMPTY_MIS = { emails: [], schedule_time: "09:00" }

// { emails?, schedule_time? } messages; {} when fine
export const validateMis = (m) => {
    const e = {}
    if (!m.emails?.length) e.emails = "At least one recipient email is required"
    else {
        const bad = m.emails.filter((x) => !EMAIL.test(x))
        if (bad.length) e.emails = `Invalid email address(es): ${bad.join(", ")}`
    }
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(m.schedule_time || "")) e.schedule_time = "Pick a time (24-hour, India time)"
    return e
}

// the recipient chips box on its own (used in the MIS groups table)
export const MisEmailsInput = ({ value, onChange, errors = {} }) => {
    const [text, setText] = useState("")
    const commit = (raw) => {
        const parts = raw.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean)
        if (!parts.length) return
        onChange({ emails: [...new Set([...(value.emails || []), ...parts])] })
        setText("")
    }
    const remove = (mail) => onChange({ emails: value.emails.filter((x) => x !== mail) })
    return (
        <>
        <div className={`flex flex-wrap items-center gap-1.5 rounded-md border bg-surface px-2 py-1.5 ${errors.emails ? "border-danger-500" : "border-line"}`}>
            {(value.emails || []).map((m) => (
                <span key={m} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${EMAIL.test(m) ? "border-brand-500 text-brand-500" : "border-danger-500 text-danger-500"}`}>
                    {m}
                    <button type="button" aria-label={`Remove ${m}`} className="border-0 bg-transparent p-0 leading-none text-inherit" onClick={() => remove(m)}>&times;</button>
                </span>
            ))}
            <input
                value={text}
                placeholder={value.emails?.length ? "" : "mis@company.com, ops@company.com"}
                className="min-w-[120px] flex-1 border-0 bg-transparent py-0.5 text-sm text-ink outline-none"
                onChange={(e) => { setText(e.target.value); if (/[,;\s]$/.test(e.target.value)) commit(e.target.value) }}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(text) } else if (e.key === "Backspace" && !text && value.emails?.length) remove(value.emails[value.emails.length - 1]) }}
                onBlur={() => commit(text)}
            />
        </div>
            {errors.emails && <div className="mt-1 text-xs text-danger-500">{errors.emails}</div>}
        </>
    )
}

const MisConfigFields = ({ value, onChange, errors = {}, actions = null }) => {
    const [text, setText] = useState("")

    // chips: a comma, space, Enter or leaving the box turns the typed text into recipients (duplicates dropped)
    const commit = (raw) => {
        const parts = raw.split(/[\s,;]+/).map((x) => x.trim().toLowerCase()).filter(Boolean)
        if (!parts.length) return
        onChange({ emails: [...new Set([...(value.emails || []), ...parts])] })
        setText("")
    }
    const remove = (mail) => onChange({ emails: value.emails.filter((x) => x !== mail) })

    return (
        <Row>
            <Col md={actions ? 6 : 8}>
                <FormGroup>
                    <Label>MIS recipient emails<span className="text-danger-500"> *</span></Label>
                    <div className={`flex flex-wrap items-center gap-1.5 rounded-md border bg-surface px-2 py-1.5 ${errors.emails ? "border-danger-500" : "border-line"}`}>
                        {(value.emails || []).map((m) => (
                            <span key={m} className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${EMAIL.test(m) ? "border-brand-500 text-brand-500" : "border-danger-500 text-danger-500"}`}>
                                {m}
                                <button type="button" aria-label={`Remove ${m}`} className="border-0 bg-transparent p-0 leading-none text-inherit" onClick={() => remove(m)}>&times;</button>
                            </span>
                        ))}
                        <input
                            value={text}
                            placeholder={value.emails?.length ? "" : "mis@company.com, ops@company.com"}
                            className="min-w-[120px] flex-1 border-0 bg-transparent py-0.5 text-sm text-ink outline-none"
                            onChange={(e) => { setText(e.target.value); if (/[,;\s]$/.test(e.target.value)) commit(e.target.value) }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); commit(text) } else if (e.key === "Backspace" && !text && value.emails?.length) remove(value.emails[value.emails.length - 1]) }}
                            onBlur={() => commit(text)}
                        />
                    </div>
                    {errors.emails && <div className="mt-1 text-xs text-danger-500">{errors.emails}</div>}
                </FormGroup>
            </Col>
            <Col md={actions ? 3 : 4}>
                <FormGroup>
                    <Label>Send daily at (India time)<span className="text-danger-500"> *</span></Label>
                    <Input type="time" name="schedule_time" value={value.schedule_time || ""} invalid={!!errors.schedule_time} onChange={(e) => onChange({ schedule_time: e.target.value })} />
                    {errors.schedule_time && <div className="mt-1 text-xs text-danger-500">{errors.schedule_time}</div>}
                </FormGroup>
            </Col>
            {actions ? (
                <Col md={3}>
                    <FormGroup>
                        <Label>&nbsp;</Label>
                        <div className="flex h-9.5 items-center gap-2">{actions}</div>
                    </FormGroup>
                </Col>
            ) : (
                <Col md={12}>
                    <p className="m-0 text-xs text-ink-muted">The daily delivery summary (last 15 days, Excel) starts at go-live.</p>
                </Col>
            )}
        </Row>
    )
}

MisConfigFields.propTypes = {
    value: PropTypes.object.isRequired,
    onChange: PropTypes.func.isRequired,
    errors: PropTypes.object,
    actions: PropTypes.node,
}

export default MisConfigFields
