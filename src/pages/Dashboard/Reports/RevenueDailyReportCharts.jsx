// Chart components for the Revenue Report dashboard tab — styled to match DailyRevenue/charts.
import ReactApexChart from "react-apexcharts";
import { Card, CardBody } from "reactstrap";
import { formatINR, formatINRCompact } from "./DailyRevenue/revenueFormat";

const PALETTE = ["#556ee6", "#34c38f", "#f1b44c", "#f46a6a", "#50a5f1", "#74788d", "#9b5de5", "#00bbf9"];

// data items are { key, value } for a single series, or { key, value, compareValue } to render
// value alongside compareValue as two grouped bars (e.g. MTD vs Same Span Last Month)
export const RevenueBarChart = ({ title, subtitle, data, height = 360, valueLabel = "MTD Revenue", compareLabel = "Same Span Last Month" }) => {
    const hasCompare = data.some((d) => d.compareValue !== undefined);
    const categories = data.map((d) => d.key);
    const series = hasCompare
        ? [
            { name: valueLabel, data: data.map((d) => Math.round(d.value * 100) / 100) },
            { name: compareLabel, data: data.map((d) => Math.round((d.compareValue ?? 0) * 100) / 100) },
        ]
        : [{ name: valueLabel, data: data.map((d) => Math.round(d.value * 100) / 100) }];

    const options = {
        chart: {
            type: "bar",
            height,
            fontFamily: "inherit",
            toolbar: { show: false },
            animations: { enabled: true, easing: "easeinout", speed: 800, dynamicAnimation: { enabled: true, speed: 400 } },
        },
        colors: hasCompare ? ["#556ee6", "#34c38f"] : ["#556ee6"],
        fill: {
            type: "gradient",
            gradient: {
                shade: "light", type: "horizontal", shadeIntensity: 0.25,
                gradientToColors: hasCompare ? ["#727cf5", "#4ecfa5"] : ["#727cf5"],
                opacityFrom: 1, opacityTo: 0.9, stops: [0, 100],
            },
        },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: "end", barHeight: hasCompare ? "62%" : "70%" } },
        dataLabels: { enabled: false },
        grid: { borderColor: "#f1f1f5", strokeDashArray: 4 },
        xaxis: {
            categories,
            labels: { formatter: (v) => formatINRCompact(v), style: { fontSize: "11px", colors: "#74788d" } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { labels: { trim: true, maxWidth: 220, style: { fontSize: "12px", colors: "#495057" } } },
        tooltip: { shared: hasCompare, intersect: !hasCompare, y: { formatter: (v) => formatINR(v) } },
        legend: hasCompare
            ? { show: true, position: "top", horizontalAlign: "right", markers: { radius: 4 }, fontSize: "12px" }
            : { show: false },
    };

    return (
        <Card className="shadow-sm border-0 h-100">
            <CardBody>
                <h6 className="fw-bold mb-1">{title}</h6>
                {subtitle && <p className="text-muted small mb-3">{subtitle}</p>}
                {data.length === 0
                    ? <p className="text-muted mb-0">No data.</p>
                    : <ReactApexChart options={options} series={series} type="bar" height={height} />}
            </CardBody>
        </Card>
    );
};

export const RevenueShareDonut = ({ title, data, topN = 6, height = 340 }) => {
    const top = data.slice(0, topN);
    const rest = data.slice(topN);
    const restTotal = rest.reduce((s, d) => s + d.value, 0);

    const labels = top.map((d) => d.key);
    const series = top.map((d) => Math.round(d.value * 100) / 100);
    if (restTotal > 0) {
        labels.push("Others");
        series.push(Math.round(restTotal * 100) / 100);
    }
    const colors = series.map((_, i) => PALETTE[i % PALETTE.length]);

    const options = {
        chart: { type: "donut", height, animations: { enabled: true, easing: "easeinout", speed: 800, dynamicAnimation: { enabled: true, speed: 400 } } },
        labels,
        colors,
        legend: { position: "bottom", fontSize: "12px" },
        dataLabels: { enabled: true, formatter: (val) => `${val.toFixed(1)}%`, dropShadow: { enabled: true, blur: 1, opacity: 0.4 } },
        stroke: { width: 1 },
        plotOptions: {
            pie: {
                donut: {
                    labels: {
                        show: true,
                        total: { show: true, label: "Total MTD Revenue", formatter: (w) => formatINR(w.globals.seriesTotals.reduce((a, b) => a + b, 0)) },
                    },
                },
            },
        },
        tooltip: { y: { formatter: (v) => formatINR(v) } },
        responsive: [{ breakpoint: 480, options: { legend: { position: "bottom" } } }],
    };

    return (
        <Card className="shadow-sm border-0 h-100">
            <CardBody>
                <h6 className="fw-bold mb-3">{title}</h6>
                {series.length === 0
                    ? <p className="text-muted mb-0">No data.</p>
                    : <ReactApexChart options={options} series={series} type="donut" height={height} />}
            </CardBody>
        </Card>
    );
};

// Diverging horizontal bar — green for gainers, red for decliners, distributed per-bar coloring
export const TopMoversChart = ({ data, height = 360 }) => {
    const categories = data.map((d) => d.key);
    const values = data.map((d) => Math.round(d.value * 100) / 100);
    const colors = values.map((v) => (v >= 0 ? "#34c38f" : "#f46a6a"));

    const options = {
        chart: {
            type: "bar",
            height,
            fontFamily: "inherit",
            toolbar: { show: false },
            animations: { enabled: true, easing: "easeinout", speed: 800, dynamicAnimation: { enabled: true, speed: 400 } },
        },
        colors,
        plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: "end", barHeight: "70%", distributed: true } },
        dataLabels: { enabled: false },
        legend: { show: false },
        grid: { borderColor: "#f1f1f5", strokeDashArray: 4 },
        xaxis: {
            categories,
            labels: { formatter: (v) => formatINRCompact(v), style: { fontSize: "11px", colors: "#74788d" } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { labels: { trim: true, maxWidth: 220, style: { fontSize: "12px", colors: "#495057" } } },
        tooltip: {
            custom: ({ dataPointIndex }) => {
                const d = data[dataPointIndex];
                const changeColor = d.value >= 0 ? "#34c38f" : "#f46a6a";
                const sign = d.value >= 0 ? "+" : "";
                return `
                    <div style="padding:8px 12px; font-family:inherit;">
                        <div style="font-weight:600; margin-bottom:4px;">${d.key}</div>
                        <div style="font-size:12px; color:#74788d;">Same Span Last Month: ${formatINR(d.baselineRevenue)}</div>
                        <div style="font-size:12px; color:#74788d;">MTD: ${formatINR(d.mtdRevenue)}</div>
                        <div style="font-size:12px; font-weight:600; color:${changeColor};">Change: ${sign}${formatINR(d.value)}</div>
                    </div>
                `;
            },
        },
    };
    const series = [{ name: "MTD Revenue Variation", data: values }];

    return (
        <Card className="shadow-sm border-0 h-100">
            <CardBody>
                <h6 className="fw-bold mb-1">Top Movers — MTD Revenue Variation</h6>
                <p className="text-muted small mb-3">Same top 10 customers by MTD revenue, shown as change vs same span last month</p>
                {data.length === 0
                    ? <p className="text-muted mb-0">No significant movers.</p>
                    : <ReactApexChart options={options} series={series} type="bar" height={height} />}
            </CardBody>
        </Card>
    );
};

// Ranked by biggest MTD % decline (not absolute revenue) so a small customer collapsing
// isn't buried under bigger accounts that dipped by a smaller percentage.
export const AtRiskCustomersCard = ({ data, minBaseline }) => (
    <Card className="shadow-sm border-0 h-100">
        <CardBody>
            <h6 className="fw-bold mb-1 text-danger">At-Risk Customers</h6>
            <p className="text-muted small mb-3">
                Biggest MTD % decline vs same span last month (baseline ≥ {formatINRCompact(minBaseline)})
            </p>
            {data.length === 0 ? (
                <p className="text-muted mb-0">No customers declining beyond the baseline threshold.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-sm table-hover mb-0">
                        <thead>
                            <tr className="text-muted small">
                                <th>Customer</th>
                                <th className="text-end">Same Span Last Month</th>
                                <th className="text-end">MTD</th>
                                <th className="text-end">% Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d) => (
                                <tr key={d.key}>
                                    <td className="text-truncate" style={{ maxWidth: 240 }} title={d.key}>{d.key}</td>
                                    <td className="text-end text-muted">{formatINR(d.baselineRevenue)}</td>
                                    <td className="text-end fw-semibold">{formatINR(d.mtdRevenue)}</td>
                                    <td className="text-end">
                                        <span className="badge bg-danger-subtle text-danger fw-bold">
                                            {d.pctChange.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </CardBody>
    </Card>
);
