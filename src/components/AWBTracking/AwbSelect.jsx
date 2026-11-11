import { useLayoutEffect, useRef, useState } from "react"
import PropTypes from "prop-types"
import { Check, ChevronDown, Search } from "lucide-react"
import { Dropdown, DropdownToggle, DropdownMenu } from "@/components/ui"

/*
 * AWB picker for multipiece shipments. Each option carries the AWB number and
 * its latest status, so the right piece can be found without opening each one.
 * Keyboard: Enter/Space opens the toggle; Escape and outside click close it.
 */
const AwbSelect = ({ options, value, onChange }) => {
    const [open, setOpen] = useState(false)
    const boxRef = useRef(null)
    const [maxH, setMaxH] = useState(288)
    const [query, setQuery] = useState("")

    // Cap the list to the space left below the button, so opening it never pushes the
    // page into scrolling; anything longer scrolls inside the list instead.
    useLayoutEffect(() => {
        if (!open || !boxRef.current) return
        const fit = () => {
            const bottom = boxRef.current.getBoundingClientRect().bottom
            setMaxH(Math.max(96, Math.min(288, Math.floor(window.innerHeight - bottom - 16))))
        }
        fit()
        window.addEventListener("resize", fit)
        return () => window.removeEventListener("resize", fit)
    }, [open])

    const current = options.find((o) => o.value === value)

    // search by AWB number or by its status
    const q = query.trim().toLowerCase()
    const shown = q
        ? options.filter((o) => o.value.toLowerCase().includes(q) || (o.status || "").toLowerCase().includes(q))
        : options

    const pick = (v) => {
        setOpen(false)
        setQuery("")
        if (v !== value) onChange(v)
    }

    return (
        <Dropdown
            ref={boxRef}
            isOpen={open}
            toggle={() => { setOpen((o) => !o); setQuery("") }}
            onKeyDown={(e) => { if (e.key === "Escape") { setOpen(false); setQuery("") } }}
        >
            <DropdownToggle
                aria-label="AWB No"
                aria-haspopup="listbox"
                aria-expanded={open}
                className="form-control !inline-flex w-auto min-w-[16rem] items-center justify-between gap-3 !py-0.5 text-[12px] font-semibold leading-tight"
            >
                <span>{current?.value || value || "Select AWB"}</span>
                <span className="flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
                    {options.length > 1 && <span>{options.findIndex((o) => o.value === value) + 1} of {options.length}</span>}
                    <ChevronDown aria-hidden="true" size={14} className={open ? "rotate-180" : ""} />
                </span>
            </DropdownToggle>

            <DropdownMenu className="scroll-slim w-full !min-w-0 overflow-y-auto overscroll-contain !p-1" style={{ maxHeight: maxH }} role="listbox">
                <div className="sticky top-0 z-10 bg-canvas pb-1">
                    <div className="relative">
                        <Search aria-hidden="true" size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-ink-muted" />
                        <input
                            type="text"
                            autoFocus
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" && shown.length === 1) pick(shown[0].value)
                            }}
                            placeholder="Search AWB"
                            aria-label="Search AWB"
                            className="form-control !h-7 w-full !py-0 !pl-7 text-[12px]"
                        />
                    </div>
                </div>
                {shown.length === 0 && <div className="px-2 py-1.5 text-[12px] text-ink-muted">No matching AWB</div>}
                {shown.map((o) => {
                    const active = o.value === value
                    return (
                        <button
                            key={o.value}
                            type="button"
                            role="option"
                            aria-selected={active}
                            onClick={() => pick(o.value)}
                            className={`flex w-full cursor-pointer items-center justify-between gap-3 rounded px-2 py-0.5 text-left leading-tight hover:bg-[rgb(var(--overlay-rgb)/0.08)] ${
                                active ? "bg-[#3B82F6]/15" : ""
                            }`}
                        >
                            <span className="flex min-w-0 items-baseline gap-2">
                                <span className={`whitespace-nowrap text-[13px] ${active ? "font-bold" : "font-semibold"} text-ink`}>{o.value}</span>
                                {o.status && <span className="truncate text-[11px] text-ink-muted">{o.status}</span>}
                            </span>
                            {active && <Check aria-hidden="true" size={14} className="shrink-0 text-[#3B82F6]" />}
                        </button>
                    )
                })}
            </DropdownMenu>
        </Dropdown>
    )
}

AwbSelect.propTypes = {
    options: PropTypes.arrayOf(PropTypes.shape({ value: PropTypes.string.isRequired, status: PropTypes.string })).isRequired,
    value: PropTypes.string,
    onChange: PropTypes.func.isRequired,
}

export default AwbSelect
