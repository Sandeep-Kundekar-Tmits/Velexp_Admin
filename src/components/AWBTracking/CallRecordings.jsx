import { useEffect, useRef, useState } from "react"
import PropTypes from "prop-types"
import { Download, Headphones, Pause, Play } from "lucide-react"

/*
 * Call recordings of the employees who handled a shipment. They come back in their own object on
 * the tracking response (not on each status event), so they sit beside the AWB picker as one
 * headphones button that opens the full list.
 */

const hasText = (v) => v !== null && v !== undefined && String(v).trim() !== ""

const mmss = (sec) => `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`
const whenText = (v) => {
    const d = new Date(v)
    return Number.isNaN(d.getTime())
        ? ""
        : d.toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
}

// One entry of booking_data.call_records (recording_url, start_time, duration_sec, agent_number, customer_number, status ...)
const asItem = (r, i) => {
    if (typeof r === "string") return hasText(r) ? { url: r, label: `Recording ${i + 1}`, meta: "" } : null
    if (!r || typeof r !== "object") return null
    const url = r.recording_url ?? r.url ?? r.file ?? r.audio_url
    if (!hasText(url)) return null
    const when = r.start_time ?? r.initiated_at ?? r.called_at ?? r.date ?? r.created_at
    const who = r.employee_name ?? r.employee ?? r.called_by ?? (hasText(r.agent_number) ? `Agent ${r.agent_number}` : "")
    const dur = Number(r.duration_sec ?? r.talk_sec)
    const status = hasText(r.status) && String(r.status).toUpperCase() !== "SUCCESS" ? r.status : ""
    return {
        url,
        label: r.name ?? r.title ?? r.label ?? (hasText(r.customer_number) ? `Call with ${r.customer_number}` : `Recording ${i + 1}`),
        meta: [when ? whenText(when) : "", dur > 0 ? mmss(dur) : "", who, status].filter(hasText).join(" · "),
    }
}

// Accepts nothing, a list, or an object keyed by AWB; returns [{ url, label, meta }].
export const normalizeRecordings = (raw, awb) => {
    if (!raw) return []
    let list = raw
    if (!Array.isArray(raw) && typeof raw === "object") {
        list = Array.isArray(raw[awb]) ? raw[awb] : Object.values(raw).flat()
    }
    return (Array.isArray(list) ? list : []).map(asItem).filter(Boolean)
}

// Save the recording. A cross-origin file can't use <a download>, so fetch it as a blob first; if the
// server doesn't allow that, open it in a new tab instead (the browser's audio page has its own download).
const downloadRecording = async (url) => {
    const name = decodeURIComponent(String(url).split("?")[0].split("/").pop() || "") || "call-recording.wav"
    try {
        const res = await fetch(url)
        if (!res.ok) throw new Error(String(res.status))
        const href = URL.createObjectURL(await res.blob())
        const a = document.createElement("a")
        a.href = href
        a.download = name
        a.click()
        URL.revokeObjectURL(href)
    } catch {
        window.open(url, "_blank", "noopener,noreferrer")
    }
}

const BTN = "relative inline-flex h-9 w-9 items-center justify-center rounded-lg border"

const fmtTime = (sec) => {
    if (!Number.isFinite(sec) || sec < 0) return "0:00"
    return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, "0")}`
}

// One compact line per recording: play/pause, name + who/when, time, and a thin seek bar.
const RecordingRow = ({ rec, isActive, onActivate }) => {
    const audioRef = useRef(null)
    const [playing, setPlaying] = useState(false)
    const [cur, setCur] = useState(0)
    const [dur, setDur] = useState(0)

    // another recording started: stop this one
    useEffect(() => {
        if (!isActive) audioRef.current?.pause()
    }, [isActive])

    const toggle = () => {
        const a = audioRef.current
        if (!a) return
        if (a.paused) {
            onActivate()
            a.play().catch(() => {})
        } else {
            a.pause()
        }
    }

    const seek = (e) => {
        const a = audioRef.current
        if (!a || !dur) return
        const box = e.currentTarget.getBoundingClientRect()
        a.currentTime = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)) * dur
    }

    return (
        <div className={`rounded-md px-1.5 py-1.5 ${playing ? "bg-[#3B82F6]/12" : "hover:bg-[rgb(var(--overlay-rgb)/0.06)]"}`}>
            <div className="flex items-center gap-2.5">
                <button
                    type="button"
                    onClick={toggle}
                    aria-label={`${playing ? "Pause" : "Play"} ${rec.label}`}
                    className="flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-full bg-[#3B82F6] text-white hover:bg-[#2563EB]"
                >
                    {playing ? <Pause aria-hidden="true" size={14} fill="currentColor" /> : <Play aria-hidden="true" size={14} fill="currentColor" className="ml-0.5" />}
                </button>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold leading-tight text-ink">{rec.label}</div>
                    {rec.meta && <div className="truncate text-[11px] leading-tight text-ink-muted">{rec.meta}</div>}
                </div>
                <span className="shrink-0 text-[11px] tabular-nums text-ink-muted">
                    {playing || cur > 0 ? `${fmtTime(cur)} / ${fmtTime(dur)}` : dur ? fmtTime(dur) : ""}
                </span>
                <button
                    type="button"
                    onClick={() => downloadRecording(rec.url)}
                    title="Download recording"
                    aria-label={`Download ${rec.label}`}
                    className="flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-ink-muted hover:bg-[rgb(var(--overlay-rgb)/0.1)] hover:text-ink"
                >
                    <Download aria-hidden="true" size={15} />
                </button>
            </div>
            <div
                role="progressbar"
                aria-label="Seek"
                aria-valuemin={0}
                aria-valuemax={Math.round(dur) || 0}
                aria-valuenow={Math.round(cur)}
                onClick={seek}
                className="ml-[2.625rem] mt-1.5 h-1.5 cursor-pointer overflow-hidden rounded-full bg-[rgb(var(--overlay-rgb)/0.12)]"
            >
                <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: dur ? `${(cur / dur) * 100}%` : "0%" }} />
            </div>
            <audio
                ref={audioRef}
                src={rec.url}
                preload="metadata"
                onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
                onTimeUpdate={(e) => setCur(e.currentTarget.currentTime)}
                onPlay={() => setPlaying(true)}
                onPause={() => setPlaying(false)}
                onEnded={() => { setPlaying(false); setCur(0) }}
            />
        </div>
    )
}

const CallRecordings = ({ recordings = [] }) => {
    const [open, setOpen] = useState(false)
    const [activeIdx, setActiveIdx] = useState(-1)
    const boxRef = useRef(null)

    useEffect(() => {
        if (!open) return undefined
        const onDown = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false) }
        const onKey = (e) => { if (e.key === "Escape") setOpen(false) }
        document.addEventListener("mousedown", onDown)
        document.addEventListener("keydown", onKey)
        return () => {
            document.removeEventListener("mousedown", onDown)
            document.removeEventListener("keydown", onKey)
        }
    }, [open])

    if (recordings.length === 0) {
        return (
            <span className={`${BTN} cursor-not-allowed border-[rgb(var(--overlay-rgb)/0.15)] bg-[rgb(var(--overlay-rgb)/0.05)] text-ink-muted opacity-60`} title="No call recordings">
                <Headphones aria-hidden="true" size={16} />
            </span>
        )
    }

    return (
        <div ref={boxRef} className="relative">
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                title="Call recordings"
                aria-label={`Call recordings (${recordings.length})`}
                aria-expanded={open}
                className={`${BTN} cursor-pointer border-[#3B82F6]/50 bg-[#3B82F6]/15 text-[#60A5FA] hover:bg-[#3B82F6]/30`}
            >
                <Headphones aria-hidden="true" size={16} />
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#3B82F6] px-1 text-[10px] font-bold leading-none text-white">
                    {recordings.length}
                </span>
            </button>

            {open && (
                <div className="absolute left-0 top-11 z-40 w-72 overflow-hidden rounded-lg border border-[rgb(var(--overlay-rgb)/0.15)] bg-canvas shadow-xl">
                    <div className="flex items-center justify-between border-b border-[rgb(var(--overlay-rgb)/0.1)] bg-[#3B82F6]/10 px-3 py-1.5">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-ink">Call recordings</span>
                        <span className="text-[11px] text-ink-muted">{recordings.length}</span>
                    </div>
                    <div className="scroll-slim max-h-64 divide-y divide-[rgb(var(--overlay-rgb)/0.06)] overflow-y-auto p-1">
                        {recordings.map((r, i) => (
                            <RecordingRow key={`${r.url}-${i}`} rec={r} isActive={activeIdx === i} onActivate={() => setActiveIdx(i)} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}

RecordingRow.propTypes = {
    rec: PropTypes.shape({ url: PropTypes.string, label: PropTypes.string, meta: PropTypes.string }).isRequired,
    isActive: PropTypes.bool,
    onActivate: PropTypes.func.isRequired,
}

CallRecordings.propTypes = {
    recordings: PropTypes.arrayOf(PropTypes.shape({ url: PropTypes.string, label: PropTypes.string, meta: PropTypes.string })),
}

export default CallRecordings
