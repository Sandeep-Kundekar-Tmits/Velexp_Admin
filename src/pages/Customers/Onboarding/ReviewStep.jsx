// Review: five numbered sections, top to bottom -
//   1 Run checks (test routes + weight)   2 Result   3 Checks by step   4 Test bookings   5 Credentials email
import { useState } from "react"
import PropTypes from "prop-types"
import { Button, Input, Label, Spinner } from "@/components/ui"
import ToasterProvider from "../../../helpers/ToasterProvider"
import { errText } from "../../NewFeatures/invoiceConfigHelpers"
import { ONBOARDING_EMAIL_PREVIEW } from "../../../api"
import CheckList, { StatusDot } from "./CheckList"
import { STATUS_LABEL, STEP_COLOR, callApi } from "./helpers"

// A titled card: number, title, one-line hint, optional action on the right.
const Section = ({ n, title, hint, action, children }) => (
    <section className="rounded-md border border-white/8 bg-surface">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/8 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2.5">
                <span aria-hidden="true" className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-xs font-bold text-brand-500">{n}</span>
                <div className="min-w-0">
                    <h6 className="m-0 text-sm font-bold">{title}</h6>
                    {hint && <p className="m-0 text-xs text-ink-muted">{hint}</p>}
                </div>
            </div>
            {action}
        </header>
        <div className="p-3">{children}</div>
    </section>
)
Section.propTypes = { n: PropTypes.number.isRequired, title: PropTypes.string.isRequired, hint: PropTypes.string, action: PropTypes.node, children: PropTypes.node }

const Empty = ({ children }) => <p className="m-0 text-sm text-ink-muted">{children}</p>
Empty.propTypes = { children: PropTypes.node }

const Chip = ({ children, tone }) => (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${tone === "ok" ? "border-success-500 text-success-500" : tone === "bad" ? "border-danger-500 text-danger-500" : tone === "warn" ? "border-warning-500 text-warning-500" : "border-white/15"}`}>
        {children}
    </span>
)
Chip.propTypes = { children: PropTypes.node, tone: PropTypes.string }

const ReviewStep = ({ customerId, checklist, loading, routes, setRoutes, weight, setWeight, onRun }) => {
    const { ErrorToaster } = ToasterProvider()
    const [preview, setPreview] = useState(null)
    const [previewing, setPreviewing] = useState(false)

    const updateRoute = (i, field, value) => setRoutes((prev) => prev.map((r, idx) => (idx === i ? { ...r, [field]: value } : r)))

    const loadPreview = async () => {
        setPreviewing(true)
        const { ok, data } = await callApi(`${ONBOARDING_EMAIL_PREVIEW}?customer_id=${customerId}`)
        setPreviewing(false)
        if (!ok) { ErrorToaster(errText(data, "Could not load the email preview")); return }
        setPreview(data)
    }

    const steps = checklist?.steps || []
    const tests = checklist?.test_results || []
    const ran = !!checklist

    return (
        <div className="flex flex-col gap-3">
            <Section
                n={1}
                title="Run checks"
                hint="Every product gets a real test booking on these routes."
                action={(
                    <Button size="sm" color="primary" onClick={onRun} disabled={loading} className="whitespace-nowrap">
                        {loading ? <><Spinner size="sm" /> Running checks...</> : ran ? "Run all checks again" : "Run all checks"}
                    </Button>
                )}
            >
                <div className="flex flex-col gap-2">
                    <p className="m-0 text-xs text-ink-muted">
                        Optional. With no route entered, each product is tested from the customer&apos;s address pincode to two of its delivery pincodes.
                    </p>
                    {routes.map((r, i) => (
                        <div key={i} className="flex flex-wrap items-center gap-2">
                            <Input className="w-36" placeholder="From pincode" value={r.from_pincode} onChange={(e) => updateRoute(i, "from_pincode", e.target.value)} />
                            <Input className="w-36" placeholder="To pincode" value={r.to_pincode} onChange={(e) => updateRoute(i, "to_pincode", e.target.value)} />
                            <Button size="sm" color="secondary" onClick={() => setRoutes((prev) => prev.filter((_, idx) => idx !== i))}>Remove</Button>
                        </div>
                    ))}
                    <div className="flex flex-wrap items-center gap-2">
                        <Button size="sm" color="secondary" onClick={() => setRoutes((prev) => [...prev, { from_pincode: "", to_pincode: "" }])}>+ Add route</Button>
                        <Label className="m-0 ml-2 text-xs text-ink-muted">Test weight (kg)</Label>
                        <Input className="w-20" type="number" min="0" step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
                    </div>
                </div>
            </Section>

            <Section n={2} title="Result" hint="Can this customer go live?">
                {!ran ? (
                    <Empty>Run the checks to see the result.</Empty>
                ) : (
                    <div className="flex flex-wrap items-center gap-2">
                        <Chip tone={checklist.ready ? "ok" : "bad"}>{checklist.ready ? "Ready to complete" : "Not ready"}</Chip>
                        <Chip tone={(checklist.blocker_count ?? 0) > 0 ? "bad" : undefined}>Blockers: {checklist.blocker_count ?? 0}</Chip>
                        <Chip tone={(checklist.warning_count ?? 0) > 0 ? "warn" : undefined}>Warnings: {checklist.warning_count ?? 0}</Chip>
                        {(checklist.products || []).length > 0 && <span className="ml-1 text-xs text-ink-muted">Products:</span>}
                        {(checklist.products || []).map((p) => <Chip key={p}>{p}</Chip>)}
                    </div>
                )}
            </Section>

            <Section n={3} title="Checks by step" hint="Open a step to see its checks. Steps with problems are open already.">
                {!ran ? (
                    <Empty>Nothing to show yet.</Empty>
                ) : (
                    <div className="flex flex-col divide-y divide-white/8 rounded-md border border-white/8">
                        {steps.map((st) => (
                            <details key={st.key} open={st.status === "blocked" || st.status === "attention"} className="px-3 py-2">
                                <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold">
                                    <StatusDot color={STEP_COLOR[st.status]} />
                                    <span>{st.order}. {st.title}</span>
                                    <span className="ml-auto text-xs font-normal" style={{ color: STEP_COLOR[st.status] }}>{STATUS_LABEL[st.status] || String(st.status || "").replace(/_/g, " ")}</span>
                                </summary>
                                <div className="mt-2"><CheckList step={st} hideHead /></div>
                            </details>
                        ))}
                    </div>
                )}
            </Section>

            <Section n={4} title="Test bookings" hint="What the test booking returned for each product and route.">
                {!ran ? (
                    <Empty>Run the checks to see the test bookings.</Empty>
                ) : tests.length === 0 ? (
                    <Empty>No test bookings in this run.</Empty>
                ) : (
                    <div className="overflow-x-auto rounded-md border border-white/8">
                        <table className="w-full whitespace-nowrap text-sm">
                            <thead>
                                <tr className="bg-[rgb(var(--overlay-rgb)/0.05)]">
                                    {["Product", "From", "To", "Result", "Amount (₹)", "Message"].map((h, i) => (
                                        <th key={h} className={`px-2 py-1.5 font-semibold text-ink-muted ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tests.map((t, i) => (
                                    <tr key={i} className="border-t border-white/8">
                                        <td className="px-2 py-1.5 font-semibold">{t.product}</td>
                                        <td className="px-2 py-1.5">{t.from_pincode}</td>
                                        <td className="px-2 py-1.5">{t.to_pincode}</td>
                                        <td className={`px-2 py-1.5 font-semibold ${t.ok ? "text-success-500" : "text-danger-500"}`}>{t.ok ? "OK" : "Failed"}</td>
                                        <td className="px-2 py-1.5 text-right">{t.total_amount ?? "—"}</td>
                                        <td className="px-2 py-1.5">{t.reason || "—"}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Section>

            <Section
                n={5}
                title="Credentials email"
                hint="What the customer receives when they go live."
                action={(
                    <Button size="sm" color="secondary" onClick={loadPreview} disabled={previewing} className="whitespace-nowrap">
                        {previewing ? "Loading..." : preview ? "Refresh preview" : "Show preview"}
                    </Button>
                )}
            >
                <div className="flex flex-col gap-2">
                    {checklist?.recipients && (
                        <p className="m-0 text-sm">
                            <strong>To:</strong> {(checklist.recipients.to || []).join(", ") || "—"}
                            {(checklist.recipients.cc || []).length ? <> &middot; <strong>Cc:</strong> {checklist.recipients.cc.join(", ")}</> : null}
                        </p>
                    )}
                    {preview ? (
                        <div className="flex flex-col gap-2">
                            <p className="m-0 text-sm"><strong>Subject:</strong> {preview.subject}</p>
                            {preview.html ? (
                                <iframe title="Email preview" sandbox="" srcDoc={preview.html} className="h-72 w-full rounded border border-white/8 bg-white" />
                            ) : (
                                <pre className="m-0 max-h-72 overflow-auto whitespace-pre-wrap text-xs">{preview.text}</pre>
                            )}
                        </div>
                    ) : (
                        <Empty>Press Show preview to read the email.</Empty>
                    )}
                </div>
            </Section>
        </div>
    )
}

ReviewStep.propTypes = {
    customerId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    checklist: PropTypes.object,
    loading: PropTypes.bool,
    routes: PropTypes.array.isRequired,
    setRoutes: PropTypes.func.isRequired,
    weight: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    setWeight: PropTypes.func.isRequired,
    onRun: PropTypes.func.isRequired,
}

export default ReviewStep
