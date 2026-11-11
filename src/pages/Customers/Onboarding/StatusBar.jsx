// Two parts of the action feedback:
//   LoaderEdge  - a 3px bar on the bottom border of the stepper card: slides while the result is being checked,
//                 then stays in the outcome colour (green / amber / red).
//   StatusBar   - the one-line message (success / warning / error) pinned at the bottom of the checks card.
import PropTypes from "prop-types"
import { CHECK_COLOR } from "./helpers"

const TONE = {
    success: { color: CHECK_COLOR.ok, label: "Success" },
    warning: { color: CHECK_COLOR.warning, label: "Warning" },
    error: { color: CHECK_COLOR.blocker, label: "Error" },
}
const colorOf = (notice) => (notice?.phase === "loading" ? "#0866ad" : TONE[notice?.phase]?.color)

const noticeShape = PropTypes.shape({ phase: PropTypes.oneOf(["loading", "success", "warning", "error"]).isRequired, text: PropTypes.string })

// Put inside a `relative overflow-hidden` container: it sits on that container's bottom border.
export const LoaderEdge = ({ notice }) => {
    if (!notice) return null
    const loading = notice.phase === "loading"
    return (
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-[3px] overflow-hidden bg-[rgb(var(--overlay-rgb)/0.12)]">
            <style>{`
                @keyframes onbSlide { 0% { left: -40%; } 100% { left: 100%; } }
                .onb-bar-run { animation: onbSlide 1.1s ease-in-out infinite; }
                @media (prefers-reduced-motion: reduce) { .onb-bar-run { animation: none; left: 0; width: 100%; opacity: .6; } }
            `}</style>
            <span
                className={`absolute top-0 h-full ${loading ? "onb-bar-run w-2/5" : "left-0 w-full"}`}
                style={{ backgroundColor: colorOf(notice) }}
            />
        </div>
    )
}
LoaderEdge.propTypes = { notice: noticeShape }

const StatusBar = ({ notice }) => {
    if (!notice) return null
    const loading = notice.phase === "loading"
    const tone = TONE[notice.phase]
    const color = colorOf(notice)
    return (
        <div role="status" aria-live="polite" className="sticky bottom-0 -mx-4 -mb-4 mt-3 border-t border-white/8 bg-surface px-4 py-3">
            <div className="flex items-start gap-2 text-sm">
                {!loading && <span className="text-xs font-bold uppercase" style={{ color }}>{tone?.label}</span>}
                <span className={loading ? "text-ink-muted" : "text-ink"}>{notice.text}</span>
            </div>
        </div>
    )
}
StatusBar.propTypes = { notice: noticeShape }

export default StatusBar
