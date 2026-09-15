// Chart components for the Revenue Report dashboard tab — styled to match DailyRevenue/charts.
import ReactApexChart from "react-apexcharts";
import { withChartTheme, categoryLabelWidth } from "./chartTheme";
import { Card, CardBody } from "@/components/ui";
import { formatINR, formatINRCompact } from "./DailyRevenue/revenueFormat";

const PALETTE = ["#3B82F6", "#22C55E", "#F59D0E", "#EF4444", "#38BDF8", "#94A3B8", "#8B5CF6", "#14B8A6"];

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

    const options = withChartTheme({
        chart: {
            type: "bar",
            height,
            fontFamily: "inherit",
            toolbar: { show: false },
            animations: { enabled: true, easing: "easeinout", speed: 800, dynamicAnimation: { enabled: true, speed: 400 } },
        },
        colors: hasCompare ? ["#3B82F6", "#22C55E"] : ["#3B82F6"],
        fill: {
            type: "gradient",
            gradient: {
                shade: "light", type: "horizontal", shadeIntensity: 0.25,
                gradientToColors: hasCompare ? ["#60A5FA", "#4ADE80"] : ["#60A5FA"],
                opacityFrom: 1, opacityTo: 0.9, stops: [0, 100],
            },
        },
        plotOptions: { bar: { horizontal: true, borderRadius: 4, borderRadiusApplication: "end", barHeight: hasCompare ? "62%" : "70%" } },
        dataLabels: { enabled: false },
        grid: { borderColor: "rgba(255,255,255,0.08)", strokeDashArray: 4 },
        xaxis: {
            categories,
            labels: { formatter: (v) => formatINRCompact(v), style: { fontSize: "11px", colors: "#94A3B8" } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { labels: { trim: true, maxWidth: categoryLabelWidth(), style: { fontSize: "12px", colors: "#CBD5E1" } } },
        tooltip: { shared: hasCompare, intersect: !hasCompare, y: { formatter: (v) => formatINR(v) } },
        legend: hasCompare
            ? { show: true, position: "top", horizontalAlign: "right", markers: { radius: 4 }, fontSize: "12px" }
            : { show: false },
    });

    return (
        <Card className="h-full">
            <CardBody>
                <h6 className="font-bold mb-1">{title}</h6>
                {subtitle && <p className="text-ink-muted text-xs mb-4">{subtitle}</p>}
                {data.length === 0
                    ? <p className="text-ink-muted mb-0">No data.</p>
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

    const options = withChartTheme({
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
    });

    return (
        <Card className="h-full">
            <CardBody>
                <h6 className="font-bold mb-4">{title}</h6>
                {series.length === 0
                    ? <p className="text-ink-muted mb-0">No data.</p>
                    : <ReactApexChart options={options} series={series} type="donut" height={height} />}
            </CardBody>
        </Card>
    );
};

// Diverging horizontal bar — green for gainers, red for decliners, distributed per-bar coloring
export const TopMoversChart = ({ data, height = 360 }) => {
    const categories = data.map((d) => d.key);
    const values = data.map((d) => Math.round(d.value * 100) / 100);
    const colors = values.map((v) => (v >= 0 ? "#22C55E" : "#EF4444"));

    const options = withChartTheme({
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
        grid: { borderColor: "rgba(255,255,255,0.08)", strokeDashArray: 4 },
        xaxis: {
            categories,
            labels: { formatter: (v) => formatINRCompact(v), style: { fontSize: "11px", colors: "#94A3B8" } },
            axisBorder: { show: false },
            axisTicks: { show: false },
        },
        yaxis: { labels: { trim: true, maxWidth: categoryLabelWidth(), style: { fontSize: "12px", colors: "#CBD5E1" } } },
        tooltip: {
            custom: ({ dataPointIndex }) => {
                const d = data[dataPointIndex];
                const changeColor = d.value >= 0 ? "#22C55E" : "#EF4444";
                const sign = d.value >= 0 ? "+" : "";
                return `
                    <div style="padding:8px 12px; font-family:inherit;">
                        <div style="font-weight:600; margin-bottom:4px;">${d.key}</div>
                        <div style="font-size:12px; color:#94A3B8;">Same Span Last Month: ${formatINR(d.baselineRevenue)}</div>
                        <div style="font-size:12px; color:#94A3B8;">MTD: ${formatINR(d.mtdRevenue)}</div>
                        <div style="font-size:12px; font-weight:600; color:${changeColor};">Change: ${sign}${formatINR(d.value)}</div>
                    </div>
                `;
            },
        },
    });
    const series = [{ name: "MTD Revenue Variation", data: values }];

    return (
        <Card className="h-full">
            <CardBody>
                <h6 className="font-bold mb-1">Top Movers — MTD Revenue Variation</h6>
                <p className="text-ink-muted text-xs mb-4">Same top 10 customers by MTD revenue, shown as change vs same span last month</p>
                {data.length === 0
                    ? <p className="text-ink-muted mb-0">No significant movers.</p>
                    : <ReactApexChart options={options} series={series} type="bar" height={height} />}
            </CardBody>
        </Card>
    );
};

// Ranked by biggest MTD % decline (not absolute revenue) so a small customer collapsing
// isn't buried under bigger accounts that dipped by a smaller percentage.
export const AtRiskCustomersCard = ({ data, minBaseline }) => (
    <Card className="h-full">
        <CardBody>
            <h6 className="font-bold mb-1 text-danger-500">At-Risk Customers</h6>
            <p className="text-ink-muted text-xs mb-4">
                Biggest MTD % decline vs same span last month (baseline ≥ {formatINRCompact(minBaseline)})
            </p>
            {data.length === 0 ? (
                <p className="text-ink-muted mb-0">No customers declining beyond the baseline threshold.</p>
            ) : (
                <div className="table-responsive">
                    <table className="table table-sm table-hover mb-0">
                        <thead>
                            <tr className="text-ink-muted text-xs">
                                <th>Customer</th>
                                <th className="text-right">Same Span Last Month</th>
                                <th className="text-right">MTD</th>
                                <th className="text-right">% Change</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((d) => (
                                <tr key={d.key}>
                                    <td className="truncate" style={{ maxWidth: 240 }} title={d.key}>{d.key}</td>
                                    <td className="text-right text-ink-muted">{formatINR(d.baselineRevenue)}</td>
                                    <td className="text-right font-semibold">{formatINR(d.mtdRevenue)}</td>
                                    <td className="text-right">
                                        <span className="badge rounded-full border border-danger-500/30 bg-danger-500/12 px-2 py-0.5 font-semibold text-danger-500">
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
