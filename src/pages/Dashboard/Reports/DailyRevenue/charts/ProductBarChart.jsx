// Animated horizontal bar chart of Gross revenue by product (product on Y, amount on X).
import ReactApexChart from "react-apexcharts"
import { Card, CardBody } from "reactstrap"
import { useState, useEffect } from "react"
import { formatINR, formatINRCompact } from "../revenueFormat"

const useWindowWidth = () => {
    const [width, setWidth] = useState(window.innerWidth)
    useEffect(() => {
        const handler = () => setWidth(window.innerWidth)
        window.addEventListener("resize", handler)
        return () => window.removeEventListener("resize", handler)
    }, [])
    return width
}

const ProductBarChart = ({ rows = [], topN = 7 }) => {
    const windowWidth = useWindowWidth()
    const isMobile = windowWidth < 576

    const sorted = [...rows].sort((a, b) => (b?.gross || 0) - (a?.gross || 0)).slice(0, topN)
    const categories = sorted.map((r) => r.product || "—")
    const series = [
        { name: "Gross", data: sorted.map((r) => Number(r.gross) || 0) },
        { name: "Net", data: sorted.map((r) => Number(r.net) || 0) },
    ]

    const chartHeight = isMobile ? Math.max(sorted.length * 50, 240) : 400

    const options = {
        chart: {
            type: "bar",
            height: chartHeight,
            fontFamily: "inherit",
            toolbar: { show: false },
            animations: {
                enabled: true,
                easing: "easeinout",
                speed: 900,
                animateGradually: { enabled: true, delay: 120 },
                dynamicAnimation: { enabled: true, speed: 450 },
            },
        },
        colors: ["#556ee6", "#34c38f"],
        fill: {
            type: "gradient",
            gradient: { shade: "light", type: "horizontal", shadeIntensity: 0.25, gradientToColors: ["#727cf5", "#4ecfa5"], opacityFrom: 1, opacityTo: 0.9, stops: [0, 100] },
        },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: "end", barHeight: "78%" } },
        dataLabels: { enabled: false },
        grid: { borderColor: "#f1f1f5", strokeDashArray: 4 },
        xaxis: {
            categories,
            labels: {
                formatter: (v) => formatINRCompact(v),
                style: { fontSize: isMobile ? "9px" : "11px", colors: "#74788d" },
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: {
            labels: {
                trim: isMobile,
                maxWidth: isMobile ? 90 : 220,
                style: { fontSize: isMobile ? "10px" : "12px", colors: "#495057" },
            },
        },
        tooltip: { shared: true, intersect: false, y: { formatter: (v) => formatINR(v) } },
        legend: {
            show: true,
            position: "top",
            horizontalAlign: "right",
            markers: { radius: 4 },
            fontSize: isMobile ? "11px" : "13px",
        },
    }

    return (
        <Card className="shadow-sm border-0 mb-4 h-100">
            <CardBody className="d-flex flex-column">
                <h6 className="fw-bold mb-1">Revenue by Product</h6>
                <p className="text-muted small mb-3">Top products by gross revenue</p>
                <div className="mt-auto">
                    {sorted.length === 0
                        ? <p className="text-muted mb-0">No product data.</p>
                        : <ReactApexChart options={options} series={series} type="bar" height={chartHeight} />}
                </div>
            </CardBody>
        </Card>
    )
}

export default ProductBarChart
