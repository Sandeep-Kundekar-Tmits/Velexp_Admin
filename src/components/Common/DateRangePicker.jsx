import { useState, useRef, useEffect } from "react"
import { DateRange } from "react-date-range"
import "react-date-range/dist/styles.css"
import "react-date-range/dist/theme/default.css"

const parseDate = (str) => {
    if (!str) return new Date()
    const [y, m, d] = str.split("-").map(Number)
    return new Date(y, m - 1, d)
}

const fmt = (date) => {
    if (!date) return ""
    return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`
}

const toYMD = (date) => {
    if (!date) return ""
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

const DateRangePicker = ({ startDate, endDate, onChange, label = "Date Range" }) => {
    const [open, setOpen] = useState(false)
    const ref = useRef()
    const [range, setRange] = useState([{
        startDate: parseDate(startDate),
        endDate: parseDate(endDate || startDate),
        key: "selection",
    }])

    useEffect(() => {
        setRange([{
            startDate: parseDate(startDate),
            endDate: parseDate(endDate || startDate),
            key: "selection",
        }])
    }, [startDate, endDate])

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener("mousedown", handler)
        return () => document.removeEventListener("mousedown", handler)
    }, [])

    const handleChange = (item) => {
        const sel = item.selection
        setRange([sel])
        onChange(toYMD(sel.startDate), toYMD(sel.endDate))
    }

    const display = startDate && endDate
        ? `${fmt(parseDate(startDate))} – ${fmt(parseDate(endDate))}`
        : "Select date range"

    return (
        <div ref={ref} style={{ position: "relative" }}>
            {label && <label className="fw-bold form-label">{label}</label>}
            <div
                onClick={() => setOpen((o) => !o)}
                className="form-control d-flex align-items-center gap-2"
                style={{ cursor: "pointer", userSelect: "none", background: "#fff", minWidth: 0 }}
            >
                <i className="mdi mdi-calendar-range text-muted" />
                <span className="text-truncate" style={{ fontSize: "0.875rem" }}>{display}</span>
            </div>
            {open && (
                <div
                    style={{
                        position: "absolute",
                        zIndex: 9999,
                        top: "calc(100% + 4px)",
                        left: 0,
                        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
                        borderRadius: 10,
                        overflow: "hidden",
                        background: "#fff",
                        border: "1px solid #dee2e6",
                    }}
                >
                    <DateRange
                        editableDateInputs
                        onChange={handleChange}
                        moveRangeOnFirstSelection={false}
                        ranges={range}
                        months={2}
                        direction="horizontal"
                        rangeColors={["#556ee6"]}
                        showDateDisplay={false}
                        maxDate={new Date()}
                    />
                    <div className="d-flex justify-content-end gap-2 px-3 py-2 border-top">
                        <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => setOpen(false)}
                        >
                            Close
                        </button>
                        <button
                            className="btn btn-sm btn-primary"
                            onClick={() => setOpen(false)}
                        >
                            Apply
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default DateRangePicker
