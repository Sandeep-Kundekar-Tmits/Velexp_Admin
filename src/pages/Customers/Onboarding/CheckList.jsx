// The checks of one checklist step: state dot, detail text and the "fix" hint.
import PropTypes from "prop-types"
import { CHECK_COLOR, STEP_COLOR } from "./helpers"

export const StatusDot = ({ color, size = 10 }) => (
    <span
        aria-hidden="true"
        style={{ display: "inline-block", width: size, height: size, borderRadius: 999, backgroundColor: color || "transparent", border: color ? 0 : "1px solid #94a3b8" }}
    />
)
StatusDot.propTypes = { color: PropTypes.string, size: PropTypes.number }

const CheckList = ({ step, hideHead = false }) => {
    if (!step) return <p className="m-0 text-sm text-ink-muted">Nothing to show yet. Use Refresh checklist.</p>
    const checks = step.checks || []
    return (
        <div>
            {!hideHead && (
                <div className="mb-2 flex items-center gap-2 text-sm">
                    <StatusDot color={STEP_COLOR[step.status]} />
                    <strong>{step.title}</strong>
                    <span className="text-ink-muted">({String(step.status || "").replace(/_/g, " ")}{step.required === false ? ", optional" : ""})</span>
                </div>
            )}
            {checks.length === 0 && <p className="m-0 text-sm text-ink-muted">No checks for this step.</p>}
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
                {checks.map((c, i) => (
                    <li key={`${c.code}-${i}`} className="rounded border border-white/8 p-2 text-sm">
                        <div className="flex items-start gap-2">
                            <span className="mt-1.5"><StatusDot color={CHECK_COLOR[c.state]} size={8} /></span>
                            <div className="min-w-0">
                                <div>
                                    <span className="mr-2 text-xs font-bold uppercase text-ink-muted">{c.state}</span>
                                    {c.detail}
                                </div>
                                {c.fix && <div className="mt-0.5 text-xs text-ink-muted">Fix: {c.fix}</div>}
                            </div>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    )
}

CheckList.propTypes = {
    hideHead: PropTypes.bool,
    step: PropTypes.shape({
        title: PropTypes.string,
        status: PropTypes.string,
        required: PropTypes.bool,
        checks: PropTypes.array,
    }),
}

export default CheckList
