// Animated area/line chart for the last-7-days Gross vs Net trend.
import ReactApexChart from "react-apexcharts"
import { Card, CardBody } from "reactstrap"
import { formatINR, formatINRCompact, shortDate } from "../revenueFormat"

const RevenueAreaChart = ({ rows = [] }) => {
    const categories = rows.map((r) => shortDate(r.date))
    const series = [
        { name: "Gross", data: rows.map((r) => Number(r.gross) || 0) },
        { name: "Net", data: rows.map((r) => Number(r.net) || 0) },
    ]

    const options = {
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
        colors: ["#556ee6", "#34c38f"],
        dataLabels: { enabled: false },
        stroke: { curve: "smooth", width: 3 },
        fill: {
            type: "gradient",
            gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [0, 90, 100] },
        },
        markers: { size: 4, hover: { size: 6 } },
        grid: { borderColor: "#f1f1f5", strokeDashArray: 4 },
        xaxis: { categories, labels: { style: { fontSize: "12px" } } },
        yaxis: { labels: { formatter: (v) => formatINRCompact(v) } },
        legend: { position: "top", horizontalAlign: "right" },
        tooltip: { shared: true, y: { formatter: (v) => formatINR(v) } },
    }

    return (
        <Card className="shadow-sm border-0 mb-4 h-100">
            <CardBody className="d-flex flex-column">
                <h6 className="fw-bold mb-1">Last 7 Days — Gross vs Net</h6>
                <p className="text-muted small mb-3">Daily gross &amp; net revenue trend</p>
                <div className="mt-auto">
                    <ReactApexChart options={options} series={series} type="area" height={400} />
                </div>
            </CardBody>
        </Card>
    )
}

export default RevenueAreaChart
