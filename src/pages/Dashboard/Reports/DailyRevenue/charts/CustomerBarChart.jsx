// Animated horizontal bar chart of Gross revenue by customer (sorted desc).
import ReactApexChart from "react-apexcharts"
import { Card, CardBody } from "reactstrap"
import { formatINR, formatINRCompact } from "../revenueFormat"

const CustomerBarChart = ({ rows = [], topN }) => {
    const sorted = [...rows].sort((a, b) => (b?.gross || 0) - (a?.gross || 0))
    const data = topN ? sorted.slice(0, topN) : sorted
    const categories = data.map((r) => r.name || "—")
    const series = [
        { name: "Gross", data: data.map((r) => Number(r.gross) || 0) },
        { name: "Net", data: data.map((r) => Number(r.net) || 0) },
    ]

    // grow height with the number of bars so every paired group has room
    const height = Math.max(360, data.length * 52 + 60)

    const options = {
        chart: {
            type: "bar",
            height,
            fontFamily: "inherit",
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: "easeinout",
                speed: 900,
                animateGradually: { enabled: true, delay: 100 },
                dynamicAnimation: { enabled: true, speed: 450 },
            },
        },
        colors: ["#556ee6", "#34c38f"],
        fill: {
            type: "gradient",
            gradient: { shade: "light", type: "horizontal", shadeIntensity: 0.25, gradientToColors: ["#727cf5", "#4ecfa5"], opacityFrom: 1, opacityTo: 0.9, stops: [0, 100] },
        },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: "end", barHeight: "80%" } },
        dataLabels: { enabled: false },
        grid: { borderColor: "#f1f1f5", strokeDashArray: 4 },
        xaxis: {
            categories,
            labels: { formatter: (v) => formatINRCompact(v), style: { fontSize: "11px", colors: "#74788d" } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: { trim: false, maxWidth: 260, style: { fontSize: "12px", colors: "#495057" } },
        },
        tooltip: { shared: true, intersect: false, y: { formatter: (v) => formatINR(v) } },
        legend: { show: true, position: "top", horizontalAlign: "right", markers: { radius: 4 } },
    }

    return (
        <Card className="shadow-sm border-0 mb-4 h-100">
            <CardBody>
                <h6 className="fw-bold mb-1">Top Customers by Revenue</h6>
                <p className="text-muted small mb-3">Gross &amp; Net revenue per customer (highest first)</p>
                {data.length === 0
                    ? <p className="text-muted mb-0">No customer data.</p>
                    : <ReactApexChart options={options} series={series} type="bar" height={height} />}
            </CardBody>
        </Card>
    )
}

export default CustomerBarChart
