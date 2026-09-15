// Today / Yesterday / MTD summary cards for the Daily Revenue dashboard.
import { MdToday, MdHistory, MdCalendarMonth, MdLocalShipping } from "react-icons/md"
import { formatINR, formatInt } from "./revenueFormat"

/*
 * Palette accents, not the Skote ones (#556ee6 / #f1b44c / #34c38f) these used
 * to carry -- those were the retired template's blue, amber and green, so the
 * three cards were the only place on the app still showing them.
 */
const ACCENTS = {
    today: "#3B82F6",
    yesterday: "#F59D0E",
    mtd: "#22C55E",
}

/* Soft tint from a hex accent, e.g. "#3B82F6" -> "rgba(59,130,246,0.14)". */
const tint = (hex, a = 0.14) => {
    const h = hex.replace("#", "")
    return `rgba(${parseInt(h.slice(0, 2), 16)},${parseInt(h.slice(2, 4), 16)},${parseInt(h.slice(4, 6), 16)},${a})`
}

const MiniStat = ({ label, value, icon: Icon }) => (
    <div className="min-w-0">
        <div className="text-[9.5px] uppercase leading-none tracking-wider text-ink-muted">
            {label}
        </div>
        <div className="mt-1 flex items-center gap-1 truncate text-[14px] font-semibold">
            {Icon && <Icon size={14} className="shrink-0 text-ink-muted" />}
            {value}
        </div>
    </div>
)

const StatCard = ({ title, icon: Icon, accent, data, showGst }) => (
    /*
     * A real panel, not `Card border-0 shadow-sm`. border-0 stripped the frame,
     * so once these stacked on a phone the three cards ran together as one
     * unbroken list of numbers with nothing to say where one ended.
     */
    <div
        className="flex h-full flex-col overflow-hidden rounded-xl border border-white/8 bg-[rgba(17,24,39,0.70)] backdrop-blur-xl"
        style={{ borderTop: `3px solid ${accent}` }}
    >
        <div className="p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
                <span
                    className="rounded px-2 py-1 text-[11.5px] font-bold uppercase tracking-wider"
                    style={{ background: tint(accent), color: accent }}
                >
                    {title}
                </span>
                <span
                    className="inline-flex size-9 shrink-0 items-center justify-center rounded-full"
                    style={{ background: tint(accent), color: accent }}
                >
                    <Icon size={19} />
                </span>
            </div>

            <div className="text-[10.5px] leading-none text-ink-muted">Gross Revenue</div>
            <p
                className="m-0 mt-1.5 truncate text-[22px] font-semibold leading-tight tracking-tight"
                style={{ color: accent }}
            >
                {formatINR(data?.gross)}
            </p>

            {/* One line of secondary figures, spread across the card. Was a
                Row/Col with an ml-auto on the last item, which on a narrow
                card wrapped each figure onto its own line. */}
            <div className="mt-3 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-white/8 pt-3">
                <MiniStat label="Net" value={formatINR(data?.net)} />
                {showGst && <MiniStat label="GST" value={formatINR(data?.gst)} />}
                <MiniStat
                    label="Shipments"
                    value={formatInt(data?.shipments)}
                    icon={MdLocalShipping}
                />
            </div>
        </div>
    </div>
)

const KpiCards = ({ today, yesterday, mtd, todayLabel = "Today", yesterdayLabel = "Yesterday" }) => {
    /*
     * A grid, not Row/Col: one card per row on a phone, two up on a tablet,
     * three across from lg. Row/Col here also fought its own gutters -- `gap-4`
     * on a Row that already has -mx-2 and Cols with px-2 gave three different
     * spacings depending on which breakpoint wrapped.
     */
    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <StatCard title={todayLabel} icon={MdToday} accent={ACCENTS.today} data={today} showGst />
            <StatCard title={yesterdayLabel} icon={MdHistory} accent={ACCENTS.yesterday} data={yesterday} />
            <StatCard title="Month to Date" icon={MdCalendarMonth} accent={ACCENTS.mtd} data={mtd} />
        </div>
    )
}

export default KpiCards
