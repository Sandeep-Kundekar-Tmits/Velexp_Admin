// Horizontal stepper for the onboarding wizard: one node per step, a status icon in each, a line through them
// that turns green up to the last finished step. Scrolls sideways on narrow screens.
import { useEffect, useRef } from "react"
import PropTypes from "prop-types"
import { STATUS_LABEL, STEP_COLOR } from "./helpers"

const ICON = {
    done: "M3.5 8.5l3 3 6-7",
    blocked: "M4.5 4.5l7 7M11.5 4.5l-7 7",
    attention: "M8 3.5v6M8 12v.5",
    optional: "M4 8h8",
}

export const Node = ({ status, n, size = 34 }) => {
    const filled = status === "done" || status === "blocked" || status === "attention"
    const color = STEP_COLOR[status] || "#94a3b8"
    return (
        <span
            aria-hidden="true"
            className="flex items-center justify-center rounded-full border-[3px] bg-surface text-xs font-bold text-ink-muted"
            style={{ width: size, height: size, borderColor: color, backgroundColor: filled ? color : undefined }}
        >
            {ICON[status] ? (
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke={status === "attention" ? "#0f172a" : filled ? "#fff" : color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                    <path d={ICON[status]} />
                </svg>
            ) : n}
        </span>
    )
}
Node.propTypes = { status: PropTypes.string, n: PropTypes.number, size: PropTypes.number }

const Stepper = ({ items, active, statusOf, onSelect, locked = false }) => {
    const count = items.length
    const activeBtn = useRef(null)

    // narrow screens scroll sideways: keep the open step in view (centred), without moving the page up or down
    useEffect(() => {
        activeBtn.current?.scrollIntoView?.({ inline: "center", block: "nearest", behavior: "smooth" })
    }, [active])
    // the green part of the line runs to the end of the unbroken run of finished steps
    let lastDone = -1
    for (let i = 0; i < count; i += 1) {
        if (statusOf(items[i]) === "done") lastDone = i
        else if (statusOf(items[i]) !== "optional") break
    }
    const span = 100 - 100 / count // line spans first node centre to last node centre
    const doneWidth = lastDone <= 0 ? 0 : (lastDone / (count - 1)) * span

    return (
        <div className="-mt-1.5 overflow-x-auto pt-1.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <ol className="relative m-0 grid list-none p-0" style={{ gridTemplateColumns: `repeat(${count}, minmax(66px, 1fr))`, minWidth: count * 66 }}>
                <li aria-hidden="true" className="pointer-events-none absolute top-[15px] h-[3px] bg-[rgb(var(--overlay-rgb)/0.12)]" style={{ left: `${50 / count}%`, right: `${50 / count}%` }} />
                <li aria-hidden="true" className="pointer-events-none absolute top-[15px] h-[3px]" style={{ left: `${50 / count}%`, width: `${doneWidth}%`, backgroundColor: STEP_COLOR.done }} />
                {items.map((item, i) => {
                    const status = statusOf(item)
                    const isActive = item.key === active
                    return (
                        <li key={item.key} className="relative flex justify-center">
                            <button
                                type="button"
                                ref={isActive ? activeBtn : undefined}
                                onClick={() => onSelect(item.key)}
                                aria-current={isActive ? "step" : undefined}
                                title={`${item.title}${status ? ` - ${STATUS_LABEL[status] || status}` : ""}`}
                                className={`flex min-h-[44px] flex-col items-center gap-1.5 border-0 bg-transparent px-1 ${locked && item.key !== "account" ? "opacity-60" : ""}`}
                            >
                                <span className="rounded-full" style={isActive ? { boxShadow: "0 0 0 5px rgb(22 191 224 / 0.35)" } : undefined}>
                                    <Node status={status} n={i + 1} />
                                </span>
                                <span className={`text-center text-xs leading-tight ${isActive ? "font-bold text-ink" : "font-medium text-ink-muted"}`}>{item.short || item.title}</span>
                                {!status && <span className="sr-only">Step {i + 1}</span>}
                            </button>
                        </li>
                    )
                })}
            </ol>
        </div>
    )
}

Stepper.propTypes = {
    items: PropTypes.arrayOf(PropTypes.shape({ key: PropTypes.string.isRequired, title: PropTypes.string, short: PropTypes.string })).isRequired,
    active: PropTypes.string,
    statusOf: PropTypes.func.isRequired,
    onSelect: PropTypes.func.isRequired,
    locked: PropTypes.bool,
}

export default Stepper
