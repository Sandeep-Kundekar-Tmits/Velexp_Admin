import { useEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { Download, ExternalLink, FileImage, Maximize2, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from "lucide-react"
import { Button } from "@/components/ui"
import { rawRequest } from "@/lib/http"
import { GET_POD_BY_AWB } from "../../api"

const MIN_ZOOM = 0.5
const MAX_ZOOM = 5
const clampZoom = (z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z))

const ToolButton = ({ onClick, title, disabled, children }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        aria-label={title}
        disabled={disabled}
        className="rounded p-1.5 text-ink hover:bg-[rgb(var(--overlay-rgb)/0.08)] disabled:opacity-50"
    >
        {children}
    </button>
)

// "View POD" button + image popup (zoom / rotate / pan / download) for one AWB.
// Renders nothing when the AWB has no POD. The lookup is silent on purpose:
// most AWBs have no POD yet, so a failed lookup must not raise an error toast.
const PodViewer = ({ awbNo, thumbnail = false }) => {
    const [podUrl, setPodUrl] = useState(null)
    const [open, setOpen] = useState(false)
    const [imgFailed, setImgFailed] = useState(false)
    const [thumbFailed, setThumbFailed] = useState(false)
    const [zoom, setZoom] = useState(1)
    const [rotation, setRotation] = useState(0)
    const [offset, setOffset] = useState({ x: 0, y: 0 })
    const [downloading, setDownloading] = useState(false)
    const dragRef = useRef(null)

    useEffect(() => {
        let cancelled = false
        setPodUrl(null)
        setThumbFailed(false)
        if (!awbNo) return undefined
        rawRequest(GET_POD_BY_AWB(awbNo), { method: "GET" })
            .then(({ ok, data }) => {
                if (!cancelled) setPodUrl(ok && data?.pod_url ? data.pod_url : null)
            })
            .catch(() => {
                if (!cancelled) setPodUrl(null)
            })
        return () => {
            cancelled = true
        }
    }, [awbNo])

    const reset = () => {
        setZoom(1)
        setRotation(0)
        setOffset({ x: 0, y: 0 })
    }

    const openViewer = () => {
        reset()
        setImgFailed(false)
        setOpen(true)
    }

    const onPointerDown = (e) => {
        dragRef.current = { x: e.clientX - offset.x, y: e.clientY - offset.y }
        e.currentTarget.setPointerCapture(e.pointerId)
    }
    const onPointerMove = (e) => {
        if (!dragRef.current) return
        setOffset({ x: e.clientX - dragRef.current.x, y: e.clientY - dragRef.current.y })
    }
    const onPointerUp = () => {
        dragRef.current = null
    }

    const download = async () => {
        setDownloading(true)
        try {
            const res = await fetch(podUrl)
            if (!res.ok) throw new Error("download failed")
            const blob = await res.blob()
            const ext = (podUrl.split("?")[0].split(".").pop() || "jpg").toLowerCase()
            const link = document.createElement("a")
            link.href = URL.createObjectURL(blob)
            link.download = `${awbNo}_POD.${ext}`
            document.body.appendChild(link)
            link.click()
            link.remove()
            URL.revokeObjectURL(link.href)
        } catch {
            // Cross-origin media without CORS cannot be read as a blob; open it so it can be saved manually.
            window.open(podUrl, "_blank", "noopener")
        } finally {
            setDownloading(false)
        }
    }

    if (!podUrl) return null

    return (
        <>
            {thumbnail ? (
                <button
                    type="button"
                    onClick={openViewer}
                    title="View POD"
                    aria-label="View POD"
                    className="flex cursor-pointer items-center gap-2 rounded-lg border border-[rgb(var(--overlay-rgb)/0.2)] bg-[rgb(var(--overlay-rgb)/0.04)] py-1 pl-1 pr-3 text-left hover:border-[#3B82F6]"
                >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md bg-[#3B82F6]/15">
                        {thumbFailed ? (
                            <FileImage aria-hidden="true" size={18} className="text-ink" />
                        ) : (
                            <img
                                src={podUrl}
                                alt=""
                                draggable={false}
                                className="h-full w-full object-cover"
                                onError={() => setThumbFailed(true)}
                            />
                        )}
                    </span>
                    <span className="flex flex-col leading-tight">
                        <span className="text-[13px] font-semibold text-ink">POD image</span>
                        <span className="text-[11px] text-ink-muted">Click to enlarge</span>
                    </span>
                    <Maximize2 aria-hidden="true" size={14} className="ml-2 shrink-0 text-ink-muted" />
                </button>
            ) : (
                <Button className="table-action-btn table-action-btn-ghost" onClick={openViewer}>
                    <FileImage aria-hidden="true" size={15} />
                    POD
                </Button>
            )}

            {open &&
                createPortal(
                    <div
                        className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/70 p-4"
                        onClick={() => setOpen(false)}
                    >
                        <div
                            className="flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-xl border border-[rgb(var(--overlay-rgb)/0.12)] bg-canvas shadow-xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[rgb(var(--overlay-rgb)/0.08)] px-4 py-2">
                                <p className="m-0 text-[14px] font-semibold text-ink">Proof of Delivery - AWB : {awbNo}</p>
                                <div className="flex items-center gap-0.5">
                                    <ToolButton title="Zoom out" onClick={() => setZoom((z) => clampZoom(z - 0.25))} disabled={zoom <= MIN_ZOOM}>
                                        <ZoomOut size={16} />
                                    </ToolButton>
                                    <span className="w-10 text-center text-[12px] tabular-nums text-ink">{Math.round(zoom * 100)}%</span>
                                    <ToolButton title="Zoom in" onClick={() => setZoom((z) => clampZoom(z + 0.25))} disabled={zoom >= MAX_ZOOM}>
                                        <ZoomIn size={16} />
                                    </ToolButton>
                                    <ToolButton title="Rotate left" onClick={() => setRotation((r) => r - 90)}>
                                        <RotateCcw size={16} />
                                    </ToolButton>
                                    <ToolButton title="Rotate right" onClick={() => setRotation((r) => r + 90)}>
                                        <RotateCw size={16} />
                                    </ToolButton>
                                    <ToolButton title="Reset view" onClick={reset}>
                                        <Maximize2 size={16} />
                                    </ToolButton>
                                    <ToolButton title="Download" onClick={download} disabled={downloading}>
                                        <Download size={16} />
                                    </ToolButton>
                                    <a
                                        href={podUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="Open in new tab"
                                        className="rounded p-1.5 text-ink hover:bg-[rgb(var(--overlay-rgb)/0.08)]"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                    <ToolButton title="Close" onClick={() => setOpen(false)}>
                                        <X size={18} />
                                    </ToolButton>
                                </div>
                            </div>

                            <div
                                className="flex h-[75vh] min-h-[300px] touch-none select-none items-center justify-center overflow-hidden bg-[rgb(var(--overlay-rgb)/0.04)]"
                                style={{ cursor: "grab" }}
                                onWheel={(e) => setZoom((z) => clampZoom(z + (e.deltaY < 0 ? 0.2 : -0.2)))}
                                onPointerDown={onPointerDown}
                                onPointerMove={onPointerMove}
                                onPointerUp={onPointerUp}
                                onPointerCancel={onPointerUp}
                            >
                                {imgFailed ? (
                                    <p className="text-[13px] text-ink-muted">POD image could not be loaded.</p>
                                ) : (
                                    <img
                                        src={podUrl}
                                        alt={`POD ${awbNo}`}
                                        draggable={false}
                                        className="max-h-full max-w-full object-contain"
                                        style={{
                                            transform: `translate(${offset.x}px, ${offset.y}px) rotate(${rotation}deg) scale(${zoom})`,
                                            transition: dragRef.current ? "none" : "transform 0.15s ease",
                                        }}
                                        onError={() => setImgFailed(true)}
                                    />
                                )}
                            </div>
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    )
}

export default PodViewer
