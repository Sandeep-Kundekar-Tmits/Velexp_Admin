// Animated donut chart for a breakdown share (top N by gross + "Others").
import ReactApexChart from "react-apexcharts"
import { withChartTheme } from "../../chartTheme"
import { Card, CardBody } from "@/components/ui"
import { formatINR } from "../revenueFormat"

const PALETTE = ["#3B82F6", "#22C55E", "#F59D0E", "#EF4444", "#38BDF8", "#94A3B8", "#8B5CF6", "#14B8A6"]

const BreakdownDonut = ({ title, rows = [], labelKey, topN = 7, legendPosition = "bottom", height = 340 }) => {
    const sorted = [...rows].sort((a, b) => (b?.gross || 0) - (a?.gross || 0))
    const top = sorted.slice(0, topN)
    const rest = sorted.slice(topN)
    const restTotal = rest.reduce((s, r) => s + (Number(r.gross) || 0), 0)

    const labels = top.map((r) => r[labelKey] || "—")
    const series = top.map((r) => Number(r.gross) || 0)
    if (restTotal > 0) {
        labels.push("Others")
        series.push(restTotal)
    }

    // extend the palette by cycling when there are more slices than base colors
    const colors = series.map((_, i) => PALETTE[i % PALETTE.length])

    const onRight = legendPosition === "right"

    const options = withChartTheme({
        chart: {
            type: "donut",
            height,
            animations: { enabled: true, easing: "easeinout", speed: 800, dynamicAnimation: { enabled: true, speed: 450 } },
        },
        labels,
        colors,
        legend: {
            position: legendPosition,
            horizontalAlign: "center",
            ...(onRight ? { fontSize: "12px", itemMargin: { vertical: 2 }, formatter: (name) => (name.length > 24 ? `${name.slice(0, 24)}…` : name) } : {}),
        },
        dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%`, dropShadow: { enabled: true, blur: 1, opacity: 0.4 } },
        stroke: { width: 1 },
        plotOptions: {
            pie: {
                donut: {
                    labels: {
                        show: true,
                        total: { show: true, label: "Total Gross", formatter: (w) => formatINR(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) },
                    },
                },
            },
        },
        tooltip: { y: { formatter: (v) => formatINR(v) } },
        responsive: [{ breakpoint: 480, options: { legend: { position: "bottom" } } }],
    })

    return (
        <Card className="h-full">
            <CardBody>
                <h6 className="m-0 mb-3 text-[13px] font-semibold text-white">{title}</h6>
                {series.length === 0
                    ? <p className="text-ink-muted mb-0">No data.</p>
                    : <ReactApexChart options={options} series={series} type="donut" height={340} />}
            </CardBody>
        </Card>
    )
}

export default BreakdownDonut
