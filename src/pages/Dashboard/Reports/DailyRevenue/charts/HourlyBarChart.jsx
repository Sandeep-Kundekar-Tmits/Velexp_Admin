// Animated column chart of Gross & Net by hour of day.
import { useMemo } from "react"
import ReactApexChart from "react-apexcharts"
import { Card, CardBody } from "reactstrap"
import { formatINR, formatINRCompact } from "../revenueFormat"

const GROSS = "#556ee6"
const NET = "#34c38f"

const HourlyBarChart = ({ rows = [] }) => {
    // Prefer the pre-built "14:00" label from index.jsx; fall back to the raw hour.
    const categories = rows.map((r) => r.label || `${r.hour}:00`)

    const { totalGross, totalNet, peak } = useMemo(() => {
        let tg = 0
        let tn = 0
        let pk = null
        rows.forEach((r) => {
            const g = Number(r.gross) || 0
            tg += g
            tn += Number(r.net) || 0
            if (!pk || g > pk.gross) pk = { gross: g, label: r.label || `${r.hour}:00` }
        })
        return { totalGross: tg, totalNet: tn, peak: pk }
    }, [rows])

    const series = [
        { name: "Gross", data: rows.map((r) => Number(r.gross) || 0) },
        { name: "Net", data: rows.map((r) => Number(r.net) || 0) },
    ]

    const options = {
        chart: {
            type: "bar",
            height: 360,
            fontFamily: "inherit",
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: "easeinout",
                speed: 800,
                animateGradually: { enabled: true, delay: 100 },
                dynamicAnimation: { enabled: true, speed: 400 },
            },
        },
        colors: [GROSS, NET],
        fill: {
            type: "gradient",
            gradient: {
                shade: "light",
                type: "vertical",
                shadeIntensity: 0.25,
                gradientToColors: ["#727cf5", "#4ecfa5"],
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 0.9,
                stops: [0, 100],
            },
        },
        plotOptions: {
            bar: {
                borderRadius: 4,
                borderRadiusApplication: "end",
                columnWidth: "62%",
            },
        },
        states: {
            hover: { filter: { type: "darken", value: 0.9 } },
            active: { filter: { type: "none" } },
        },
        dataLabels: { enabled: false },
        grid: {
            borderColor: "#f1f1f5",
            strokeDashArray: 4,
            padding: { left: 8, right: 8 },
        },
        xaxis: {
            categories,
            title: { text: "Hour of day", style: { fontSize: "12px", fontWeight: 600, color: "#74788d" } },
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { rotate: -45, rotateAlways: false, hideOverlappingLabels: true, style: { fontSize: "11px", colors: "#74788d" } },
            tooltip: { enabled: false },
        },
        yaxis: { labels: { formatter: (v) => formatINRCompact(v), style: { fontSize: "11px", colors: "#74788d" } } },
        legend: {
            position: "top",
            horizontalAlign: "right",
            markers: { radius: 4 },
            fontSize: "12px",
            fontWeight: 500,
        },
        tooltip: {
            shared: true,
            intersect: false,
            y: { formatter: (v) => formatINR(v) },
        },
        responsive: [{ breakpoint: 576, options: { plotOptions: { bar: { columnWidth: "80%" } }, xaxis: { labels: { rotate: -90 } } } }],
    }

    return (
        <Card className="shadow-sm border-0 mb-4 h-100">
            <CardBody>
                <div className="d-flex flex-wrap justify-content-between align-items-start mb-3 gap-2">
                    <div>
                        <h6 className="fw-bold mb-1">Revenue by Hour</h6>
                        <p className="text-muted small mb-0">Gross &amp; Net distribution across the day</p>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                        <span className="fw-semibold px-2 py-1 rounded" style={{ fontSize: "12px", background: "rgba(85,110,230,0.12)", color: "#556ee6" }}>
                            Gross {formatINRCompact(totalGross)}
                        </span>
                        <span className="fw-semibold px-2 py-1 rounded" style={{ fontSize: "12px", background: "rgba(52,195,143,0.14)", color: "#34c38f" }}>
                            Net {formatINRCompact(totalNet)}
                        </span>
                        {peak && peak.gross > 0 && (
                            <span className="fw-semibold px-2 py-1 rounded border" style={{ fontSize: "12px", background: "#f8f9fa", color: "#495057" }}>
                                Peak {peak.label} · {formatINRCompact(peak.gross)}
                            </span>
                        )}
                    </div>
                </div>

                {rows.length === 0 ? (
                    <p className="text-muted mb-0">No hourly data.</p>
                ) : (
                    <ReactApexChart options={options} series={series} type="bar" height={360} />
                )}
            </CardBody>
        </Card>
    )
}

export default HourlyBarChart
