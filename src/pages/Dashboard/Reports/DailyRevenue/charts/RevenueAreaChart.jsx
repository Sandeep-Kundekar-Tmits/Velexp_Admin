// Animated area/line chart for the last-7-days Gross vs Net trend.
import ReactApexChart from "react-apexcharts"
import { withChartTheme, axisLabelStyle } from "../../chartTheme"
import { Card, CardBody } from "@/components/ui"
import { formatINR, formatINRCompact, shortDate } from "../revenueFormat"

const RevenueAreaChart = ({ rows = [] }) => {
    const categories = rows.map((r) => shortDate(r.date))
    const series = [
        { name: "Gross", data: rows.map((r) => Number(r.gross) || 0) },
        { name: "Net", data: rows.map((r) => Number(r.net) || 0) },
    ]

    const options = withChartTheme({
        chart: {
            type: "area",
            height: 400,
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: "easeinout",
                speed: 900,
                animateGradually: { enabled: true, delay: 150 },
                dynamicAnimation: { enabled: true, speed: 450 },
            },
        },
        colors: ["#3B82F6", "#22C55E"],
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 3 },
        fill: {
            type: "gradient",
            gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
        },
        markers: { size: 4, hover: { size: 6 } },
        grid: { borderColor: "rgba(255,255,255,0.08)", strokeDashArray: 4 },
        xaxis: { categories, labels: { style: axisLabelStyle("12px") } },
        yaxis: { labels: { formatter: (v) => formatINRCompact(v), style: axisLabelStyle() } },
        legend: { position: "top", horizontalAlign: "right" },
        tooltip: { shared: true, y: { formatter: (v) => formatINR(v) } },
    })

    return (
        <Card className="h-full">
            <CardBody className="flex flex-col">
                <h6 className="m-0 text-[13px] font-semibold text-white">Last 7 Days — Gross vs Net</h6>
                <p className="m-0 mb-3 mt-0.5 text-[11px] text-ink-muted">Daily gross &amp; net revenue trend</p>
                <div className="mt-auto">
                    <ReactApexChart options={options} series={series} type="area" height={400} />
                </div>
            </CardBody>
        </Card>
    )
}

export default RevenueAreaChart
