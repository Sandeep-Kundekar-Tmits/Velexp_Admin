// 2D SVG India map: states colour-coded by their total hub revenue (choropleth),
// service-center hubs pinned by lat/lng. Hover a state or a pin to see its revenue.
import { useMemo, useState } from "react"
import { ComposableMap, Geographies, Geography, Marker } from "react-simple-maps"
import { feature } from "topojson-client"
import { geoContains, geoMercator } from "d3-geo"
import { Card, CardBody, Modal, ModalBody, ModalHeader } from "reactstrap"
import { formatINR, formatINRCompact, formatInt } from "../revenueFormat"
import indiaTopo from "./india.topo.json"

// India as GeoJSON features (named states only) — used for point-in-state lookup.
const STATE_FEATURES = feature(indiaTopo, indiaTopo.objects.india).features.filter((f) => f?.properties?.name)

// A coordinate is usable only if both are real numbers and not the 0,0 "null island" placeholder.
const hasValidCoords = (r) => {
    const lat = Number(r?.lat)
    const lng = Number(r?.lng)
    return Number.isFinite(lat) && Number.isFinite(lng) && !(lat === 0 && lng === 0)
}

// --- graduated colour ranges: each revenue band gets a distinct blue shade ---
const NO_DATA = "#eef1f6"
const BUCKETS = [
    { upTo: 50000, color: "#ffe08a", label: "< ₹50K" },
    { upTo: 100000, color: "#fdae61", label: "₹50K – ₹1L" },
    { upTo: 500000, color: "#f46d43", label: "₹1L – ₹5L" },
    { upTo: 1000000, color: "#d7301f", label: "₹5L – ₹10L" },
    { upTo: Infinity, color: "#7f0000", label: "≥ ₹10L" },
]
const colorOf = (g) => (g > 0 ? (BUCKETS.find((b) => g < b.upTo) || BUCKETS[BUCKETS.length - 1]).color : NO_DATA)
// darken a #rrggbb by a factor for the hover state
const darkenHex = (hex, f = 0.8) => {
    const n = parseInt(hex.slice(1), 16)
    return `rgb(${Math.round(((n >> 16) & 255) * f)}, ${Math.round(((n >> 8) & 255) * f)}, ${Math.round((n & 255) * f)})`
}

// --- Drill-down popup: zoomed map of one state + its service centers ---
const MODAL_W = 1000
const MODAL_H = 620

const StateDetailModal = ({ stateName, points = [], onClose }) => {
    const [hoverCode, setHoverCode] = useState(null) // service center hovered → show details below its pin
    const stateFeature = useMemo(
        () => STATE_FEATURES.find((f) => f.properties?.name === stateName) || null,
        [stateName]
    )

    // service centers whose coordinates fall inside this state, highest revenue first
    const centers = useMemo(() => {
        if (!stateFeature) return []
        return points
            .filter((p) => geoContains(stateFeature, [p.lng, p.lat]))
            .sort((a, b) => b.gross - a.gross)
    }, [stateFeature, points])

    // fit the projection tightly to this state's geometry
    const projection = useMemo(() => {
        if (!stateFeature) return null
        return geoMercator().fitExtent(
            [[28, 28], [MODAL_W - 28, MODAL_H - 28]],
            { type: "FeatureCollection", features: [stateFeature] }
        )
    }, [stateFeature])

    // Decide where each on-map label sits: walk centers highest-revenue-first; try the
    // top of the pin, and if that collides with an already-placed label, drop it to the
    // bottom; if both collide, hide it (details still show on hover).
    const labelPlacement = useMemo(() => {
        const place = {}
        if (!projection) return place
        const placed = []
        const hits = (x, y) => placed.some((p) => Math.abs(p.x - x) < 64 && Math.abs(p.y - y) < 30)
        centers.forEach((c) => {
            const xy = projection([c.lng, c.lat])
            if (!xy) { place[c.code] = null; return }
            const [x, y] = xy
            if (!hits(x, y - 22)) { place[c.code] = "top"; placed.push({ x, y: y - 22 }) }
            else if (!hits(x, y + 22)) { place[c.code] = "bottom"; placed.push({ x, y: y + 22 }) }
            else place[c.code] = null
        })
        return place
    }, [centers, projection])

    const totals = centers.reduce(
        (t, c) => ({ gross: t.gross + c.gross, net: t.net + c.net, shipments: t.shipments + c.shipments }),
        { gross: 0, net: 0, shipments: 0 }
    )
    const stateColor = colorOf(totals.gross) // same revenue color-bucket as the choropleth

    return (
        <Modal isOpen={!!stateName} toggle={onClose} fullscreen modalClassName="sc-zoom-modal">
            <ModalHeader toggle={onClose}>
                {stateName}
                <span className="text-muted fw-normal ms-2" style={{ fontSize: "13px" }}>
                    {centers.length} service center{centers.length === 1 ? "" : "s"} · {formatINR(totals.gross)}
                </span>
            </ModalHeader>
            <ModalBody className="p-2" style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
                <style>{`
                    /* zoom-open instead of the default slide-from-top */
                    .modal.sc-zoom-modal.fade .modal-dialog { transform: scale(.45); opacity: 0; transition: transform .4s cubic-bezier(.34,1.56,.64,1), opacity .3s ease; transform-origin: center center; }
                    .modal.sc-zoom-modal.show .modal-dialog { transform: scale(1); opacity: 1; }
                    @keyframes scMapFade { from { opacity: 0; transform: scale(.97) } to { opacity: 1; transform: none } }
                    @keyframes scPinPop { 0% { opacity: 0; transform: scale(0) } 60% { transform: scale(1.18) } 100% { opacity: 1; transform: scale(1) } }
                    @keyframes scLblIn { from { opacity: 0 } to { opacity: 1 } }
                    @keyframes scRowIn { from { opacity: 0; transform: translateY(8px) } to { opacity: 1; transform: none } }
                    .sc-row { animation: scRowIn .4s ease both; }
                    .sc-pin { transform-box: fill-box; transform-origin: center; animation: scPinPop .55s cubic-bezier(.34,1.56,.64,1) both; transition: r .2s ease, fill-opacity .2s ease; }
                    .sc-pin:hover { fill-opacity: 1 !important; }
                    .sc-lbl { paint-order: stroke; stroke: #fff; stroke-width: 3px; stroke-linejoin: round; animation: scLblIn .6s ease both; pointer-events: none; }
                `}</style>

                <div
                    style={{
                        position: "relative",
                        flex: "1 1 auto",
                        minHeight: 0,
                        borderRadius: 14,
                        overflow: "hidden",
                        background: "radial-gradient(120% 120% at 30% 10%, #f5f7ff 0%, #e8edff 45%, #d7defb 100%)",
                        animation: "scMapFade .45s ease both",
                    }}
                    onMouseLeave={() => setHoverCode(null)}
                >
                    {projection ? (
                        <ComposableMap projection={projection} width={MODAL_W} height={MODAL_H} style={{ width: "100%", height: "100%", display: "block" }}>
                            <Geographies geography={indiaTopo}>
                                {({ geographies }) =>
                                    geographies
                                        .filter((geo) => geo.properties?.name === stateName)
                                        .map((geo) => (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={stateColor}
                                                stroke="#0b0f1a"
                                                strokeWidth={0.9}
                                                style={{
                                                    default: { outline: "none", transition: "fill .4s ease" },
                                                    hover: { outline: "none" },
                                                    pressed: { outline: "none" },
                                                }}
                                            />
                                        ))
                                }
                            </Geographies>

                            {centers.map((c, i) => {
                                const r = 6 // uniform pin size, same as the main map
                                return (
                                    <Marker
                                        key={`${c.code}-${i}`}
                                        coordinates={[c.lng, c.lat]}
                                        onMouseEnter={() => setHoverCode(c.code)}
                                        onMouseLeave={() => setHoverCode(null)}
                                    >
                                        <circle
                                            className="sc-pin"
                                            r={r}
                                            fill="#000000"
                                            fillOpacity={0.95}
                                            stroke="#ffffff"
                                            strokeWidth={1}
                                            style={{ animationDelay: `${i * 70}ms`, cursor: "pointer" }}
                                        />
                                        {/* details printed on the map — top by default; flips to bottom when it would overlap; hidden if both collide (still on hover) */}
                                        {labelPlacement[c.code] === "top" && (
                                            <>
                                                <text textAnchor="middle" y={-r - 14} className="sc-lbl" style={{ fontSize: 12.5, fontWeight: 800, fill: "#10233f", animationDelay: `${i * 70 + 120}ms` }}>
                                                    {c.code}
                                                </text>
                                                <text textAnchor="middle" y={-r - 2} className="sc-lbl" style={{ fontSize: 11, fontWeight: 600, fill: "#1f2d4d", animationDelay: `${i * 70 + 180}ms` }}>
                                                    {formatINRCompact(c.gross)} · {formatInt(c.shipments)} shp
                                                </text>
                                            </>
                                        )}
                                        {labelPlacement[c.code] === "bottom" && (
                                            <>
                                                <text textAnchor="middle" y={r + 14} className="sc-lbl" style={{ fontSize: 12.5, fontWeight: 800, fill: "#10233f", animationDelay: `${i * 70 + 120}ms` }}>
                                                    {c.code}
                                                </text>
                                                <text textAnchor="middle" y={r + 26} className="sc-lbl" style={{ fontSize: 11, fontWeight: 600, fill: "#1f2d4d", animationDelay: `${i * 70 + 180}ms` }}>
                                                    {formatINRCompact(c.gross)} · {formatInt(c.shipments)} shp
                                                </text>
                                            </>
                                        )}
                                    </Marker>
                                )
                            })}

                            {/* hover details — rendered last (on top), below the hovered pin */}
                            {(() => {
                                const c = centers.find((x) => x.code === hoverCode)
                                if (!c) return null
                                const r = 6
                                return (
                                    <Marker coordinates={[c.lng, c.lat]} style={{ pointerEvents: "none" }}>
                                        <g style={{ pointerEvents: "none" }}>
                                            <rect x={-92} y={r + 6} width={184} height={78} rx={9} fill="rgba(15,18,38,0.95)" stroke="rgba(255,255,255,0.18)" strokeWidth={1} />
                                            <text x={0} y={r + 26} textAnchor="middle" fill="#fff" style={{ fontSize: 12.5, fontWeight: 800 }}>{c.code}</text>
                                            <text x={-80} y={r + 43} fill="#ffffff" style={{ fontSize: 11 }}>Gross: {formatINR(c.gross)}</text>
                                            <text x={-80} y={r + 58} fill="#cfd6e6" style={{ fontSize: 11 }}>Net: {formatINR(c.net)}</text>
                                            <text x={-80} y={r + 73} fill="#cfd6e6" style={{ fontSize: 11 }}>Shipments: {formatInt(c.shipments)}</text>
                                        </g>
                                    </Marker>
                                )
                            })()}
                        </ComposableMap>
                    ) : (
                        <p className="text-muted p-4 mb-0">Map unavailable for this state.</p>
                    )}

                    {centers.length === 0 && projection && (
                        <div className="position-absolute top-50 start-50 translate-middle text-muted bg-white px-3 py-2 rounded shadow-sm">
                            No geocoded service centers in {stateName}.
                        </div>
                    )}

                    {/* state revenue detail + service-center list — top right */}
                    <div
                        style={{
                            position: "absolute", right: 16, top: 16, zIndex: 6, width: 280, maxHeight: "calc(100% - 32px)", display: "flex", flexDirection: "column",
                            background: "rgba(255,255,255,0.94)", backdropFilter: "blur(6px)",
                            border: "1px solid rgba(0,0,0,0.08)", borderRadius: 12,
                            boxShadow: "0 8px 24px rgba(0,0,0,0.12)", padding: "14px 16px",
                            animation: "scMapFade .5s ease both",
                        }}
                    >
                        <div className="fw-bold mb-2" style={{ fontSize: 15 }}>{stateName}</div>
                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: 12.5 }}>
                            <span className="text-muted">Gross</span><span className="fw-bold">{formatINR(totals.gross)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: 12.5 }}>
                            <span className="text-muted">Net</span><span className="fw-semibold">{formatINR(totals.net)}</span>
                        </div>
                        <div className="d-flex justify-content-between mb-1" style={{ fontSize: 12.5 }}>
                            <span className="text-muted">Shipments</span><span className="fw-semibold">{formatInt(totals.shipments)}</span>
                        </div>
                        <div className="d-flex justify-content-between pt-1 mt-1 border-top" style={{ fontSize: 12.5 }}>
                            <span className="text-muted">Service Centers</span><span className="fw-semibold">{centers.length}</span>
                        </div>

                        {/* per service-center revenue, below the state detail */}
                        {centers.length > 0 && (
                            <div className="mt-2 pt-2 border-top" style={{ overflowY: "auto", minHeight: 0, paddingRight: 10 }}>
                                {centers.map((c, i) => (
                                    <div
                                        key={c.code}
                                        className="sc-row d-flex align-items-center justify-content-between py-1 border-bottom"
                                        style={{ fontSize: 12.5, animationDelay: `${i * 40}ms` }}
                                    >
                                        <span className="d-flex align-items-center gap-2 text-truncate" style={{ minWidth: 0 }}>
                                            <span style={{ width: 9, height: 9, borderRadius: 2, background: colorOf(c.gross), border: "1px solid rgba(0,0,0,0.12)", flex: "0 0 auto" }} />
                                            <span className="fw-semibold text-truncate" title={c.code}>{c.code}</span>
                                        </span>
                                        <span className="fw-semibold ms-2" style={{ whiteSpace: "nowrap" }}>{formatINR(c.gross)}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* revenue color legend */}
                    <div
                        style={{
                            position: "absolute", left: 12, bottom: 12, zIndex: 5,
                            display: "flex", flexDirection: "column", gap: 5, padding: "9px 11px",
                            background: "rgba(255,255,255,0.9)", backdropFilter: "blur(4px)",
                            border: "1px solid rgba(0,0,0,0.1)", borderRadius: 8, boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                            font: "11px/1.2 sans-serif", color: "#495057",
                        }}
                    >
                        <div style={{ fontWeight: 700, marginBottom: 2 }}>Revenue</div>
                        {BUCKETS.map((b) => (
                            <span key={b.label} style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                                <span style={{ width: 12, height: 12, borderRadius: 3, background: b.color, border: "1px solid rgba(0,0,0,0.12)" }} />
                                {b.label}
                            </span>
                        ))}
                    </div>

                </div>
            </ModalBody>
        </Modal>
    )
}

const ServiceCenterMap = ({ rows = [] }) => {
    const [tip, setTip] = useState(null) // { x, y, title, rows: [{label, value, bold}] }
    const [selectedState, setSelectedState] = useState(null) // state name for the drill-down popup

    const points = useMemo(() => {
        return rows.filter(hasValidCoords).map((r) => ({
            lat: Number(r.lat),
            lng: Number(r.lng),
            code: r.dest_sc,
            gross: Number(r.gross) || 0,
            net: Number(r.net) || 0,
            shipments: Number(r.shipments) || 0,
            radius: 6, // uniform medium pins for every service center
        }))
    }, [rows])

    // Sum gross + hub count per state via point-in-polygon.
    const stateRevenue = useMemo(() => {
        const m = {}
        points.forEach((p) => {
            const f = STATE_FEATURES.find((ft) => geoContains(ft, [p.lng, p.lat]))
            if (!f) return
            const n = f.properties.name
            if (!m[n]) m[n] = { gross: 0, hubs: 0 }
            m[n].gross += p.gross
            m[n].hubs += 1
        })
        return m
    }, [points])

    const skipped = useMemo(() => rows.filter((r) => !hasValidCoords(r)).length, [rows])

    // States with revenue, highest first — for the side list.
    const stateList = useMemo(
        () =>
            Object.entries(stateRevenue)
                .map(([name, v]) => ({ name, gross: v.gross, hubs: v.hubs }))
                .sort((a, b) => b.gross - a.gross),
        [stateRevenue]
    )
    const totalGross = useMemo(() => stateList.reduce((s, x) => s + x.gross, 0), [stateList])

    return (
        <Card className="shadow-sm border-0 mb-4 h-100">
            <CardBody>
                <div className="mb-2">
                    <h6 className="fw-bold mb-1">Service Centers</h6>
                    <p className="text-muted small mb-0">
                        States shaded by revenue · {points.length} hubs pinned · click a state for its service centers
                        {skipped > 0 && <span className="ms-1">· {skipped} without coordinates hidden</span>}
                    </p>
                </div>

                {points.length === 0 ? (
                    <p className="text-muted mb-0 py-5">No geocoded service centers.</p>
                ) : (
                    <div className="d-flex flex-wrap gap-3 align-items-stretch">
                    <div
                        style={{
                            flex: "1 1 460px",
                            minWidth: 0,
                            position: "relative",
                            borderRadius: 16,
                            overflow: "hidden",
                            background: "radial-gradient(120% 120% at 30% 10%, #f5f7ff 0%, #e8edff 45%, #d7defb 100%)",
                            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.6)",
                        }}
                        onMouseLeave={() => setTip(null)}
                    >
                        <ComposableMap
                            projection="geoMercator"
                            projectionConfig={{ center: [82.5, 22.5], scale: 1045 }}
                            width={800}
                            height={680}
                            style={{ width: "100%", height: "auto", display: "block" }}
                        >
                            <defs>
                                <filter id="glassDepth" x="-20%" y="-20%" width="140%" height="140%">
                                    <feDropShadow dx="0" dy="6" stdDeviation="7" floodColor="#1e293b" floodOpacity="0.30" />
                                </filter>
                                <filter id="pinGlow" x="-80%" y="-80%" width="260%" height="260%">
                                    <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#111827" floodOpacity="0.55" />
                                </filter>
                            </defs>

                            <Geographies geography={indiaTopo}>
                                {({ geographies }) =>
                                    geographies.map((geo) => {
                                        const name = geo.properties?.name
                                        const sr = name ? stateRevenue[name] : null
                                        const base = colorOf(sr?.gross || 0)
                                        const hov = sr ? darkenHex(base) : "#e2e6ee"
                                        return (
                                            <Geography
                                                key={geo.rsmKey}
                                                geography={geo}
                                                fill={base}
                                                stroke="#0b0f1a"
                                                strokeWidth={0.8}
                                                filter="url(#glassDepth)"
                                                onMouseEnter={(e) =>
                                                    setTip({
                                                        x: e.clientX,
                                                        y: e.clientY,
                                                        title: name || "—",
                                                        rows: sr
                                                            ? [
                                                                  { label: "Revenue", value: formatINR(sr.gross), bold: true },
                                                                  { label: "Hubs", value: formatInt(sr.hubs) },
                                                              ]
                                                            : [{ label: "", value: "No service centers" }],
                                                    })
                                                }
                                                onMouseMove={(e) => setTip((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))}
                                                onMouseLeave={() => setTip(null)}
                                                onClick={() => name && setSelectedState(name)}
                                                style={{
                                                    default: { fill: base, outline: "none" },
                                                    hover: { fill: hov, outline: "none", cursor: "pointer" },
                                                    pressed: { fill: hov, outline: "none" },
                                                }}
                                            />
                                        )
                                    })
                                }
                            </Geographies>

                            {points.map((p, i) => (
                                <Marker
                                    key={`${p.code}-${i}`}
                                    coordinates={[p.lng, p.lat]}
                                    onMouseEnter={(e) =>
                                        setTip({
                                            x: e.clientX,
                                            y: e.clientY,
                                            title: p.code,
                                            rows: [
                                                { label: "Gross", value: formatINR(p.gross), bold: true },
                                                { label: "Net", value: formatINR(p.net) },
                                                { label: "Shipments", value: formatInt(p.shipments) },
                                            ],
                                        })
                                    }
                                    onMouseMove={(e) => setTip((h) => (h ? { ...h, x: e.clientX, y: e.clientY } : h))}
                                    onMouseLeave={() => setTip(null)}
                                >
                                    <circle
                                        r={p.radius}
                                        fill="#10233f"
                                        fillOpacity={0.92}
                                        stroke="#ffffff"
                                        strokeWidth={1.1}
                                        filter="url(#pinGlow)"
                                        style={{ cursor: "pointer" }}
                                    />
                                </Marker>
                            ))}
                        </ComposableMap>

                        {/* revenue-range legend, single column, bottom-right of the map */}
                        <div
                            style={{
                                position: "absolute",
                                right: 12,
                                bottom: 12,
                                zIndex: 5,
                                display: "flex",
                                flexDirection: "column",
                                gap: 6,
                                padding: "10px 12px",
                                background: "rgba(255,255,255,0.88)",
                                backdropFilter: "blur(4px)",
                                border: "1px solid rgba(0,0,0,0.1)",
                                borderRadius: 8,
                                boxShadow: "0 4px 14px rgba(0,0,0,0.12)",
                                font: "11px/1.2 sans-serif",
                                color: "#495057",
                            }}
                        >
                            <div style={{ fontWeight: 700, marginBottom: 2 }}>Revenue</div>
                            {BUCKETS.map((b) => (
                                <span key={b.label} style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                                    <span style={{ width: 13, height: 13, borderRadius: 3, background: b.color, border: "1px solid rgba(0,0,0,0.12)" }} />
                                    {b.label}
                                </span>
                            ))}
                            <span style={{ display: "flex", alignItems: "center", gap: 6, whiteSpace: "nowrap" }}>
                                <span style={{ width: 13, height: 13, borderRadius: 3, background: NO_DATA, border: "1px solid rgba(0,0,0,0.12)" }} />
                                No data
                            </span>
                        </div>

                        {tip && (
                            <div
                                style={{
                                    position: "fixed",
                                    left: tip.x + 14,
                                    top: tip.y + 14,
                                    zIndex: 1080,
                                    pointerEvents: "none",
                                    background: "rgba(15,18,38,0.92)",
                                    color: "#fff",
                                    padding: "8px 11px",
                                    borderRadius: 8,
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
                                    font: "12px/1.45 sans-serif",
                                    minWidth: 140,
                                }}
                            >
                                <div style={{ fontWeight: 700, marginBottom: 3 }}>{tip.title}</div>
                                {tip.rows.map((r, idx) => (
                                    <div key={idx}>
                                        {r.label ? `${r.label}: ` : ""}
                                        {r.bold ? <b>{r.value}</b> : r.value}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Revenue list beside the map — states by revenue, highest first */}
                    <div
                        style={{ flex: "0 0 260px", maxHeight: 560, overflowY: "auto" }}
                        className="border rounded-3 p-2 bg-white"
                    >
                        <div className="d-flex justify-content-between align-items-center px-1 mb-2">
                            <span className="fw-bold">Revenue by State</span>
                            <span className="text-muted small">{formatINR(totalGross)}</span>
                        </div>
                        {stateList.length === 0 ? (
                            <p className="text-muted small px-1 mb-0">No state revenue.</p>
                        ) : (
                            stateList.map((s) => (
                                <div
                                    key={s.name}
                                    role="button"
                                    tabIndex={0}
                                    onClick={() => setSelectedState(s.name)}
                                    onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setSelectedState(s.name)}
                                    className="d-flex align-items-center justify-content-between px-1 py-1 border-bottom state-row"
                                    style={{ fontSize: "12.5px", cursor: "pointer" }}
                                    title={`View ${s.name} service centers`}
                                >
                                    <span className="d-flex align-items-center gap-2 text-truncate" style={{ minWidth: 0 }}>
                                        <span style={{ width: 11, height: 11, borderRadius: 3, background: colorOf(s.gross), border: "1px solid rgba(0,0,0,0.12)", flex: "0 0 auto" }} />
                                        <span className="text-truncate">{s.name}</span>
                                    </span>
                                    <span className="fw-semibold ms-2" style={{ whiteSpace: "nowrap" }}>{formatINR(s.gross)}</span>
                                </div>
                            ))
                        )}
                    </div>
                    </div>
                )}

                {selectedState && (
                    <StateDetailModal
                        stateName={selectedState}
                        points={points}
                        onClose={() => setSelectedState(null)}
                    />
                )}
            </CardBody>
        </Card>
    )
}

export default ServiceCenterMap
