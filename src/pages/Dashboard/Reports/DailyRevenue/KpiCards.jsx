// Today / Yesterday / MTD summary cards for the Daily Revenue dashboard.
import { Card, CardBody, Col, Row } from "@/components/ui"
import { MdToday, MdHistory, MdCalendarMonth, MdLocalShipping } from "react-icons/md"
import { formatINR, formatInt } from "./revenueFormat"

// soft tinted background from a hex accent (e.g. "#556ee6" -> "rgba(85,110,230,0.12)")
const tint = (hex, a = 0.12) => {
    const h = hex.replace("#", "")
    const r = parseInt(h.slice(0, 2), 16)
    const g = parseInt(h.slice(2, 4), 16)
    const b = parseInt(h.slice(4, 6), 16)
    return `rgba(${r},${g},${b},${a})`
}

const MiniStat = ({ label, value }) => (
    <Col xs="auto">
        <div className="text-ink-muted uppercase lh-1" style={{ fontSize: "9.5px", letterSpacing: ".4px" }}>{label}</div>
        <div className="font-semibold" style={{ fontSize: "14px" }}>{value}</div>
    </Col>
)

const StatCard = ({ title, icon: Icon, accent, data, showGst }) => (
    <Card className="border-0 shadow-sm h-full" style={{ borderTop: `3px solid ${accent}`, overflow: "hidden" }}>
        <CardBody className="px-4 py-2">
            <div className="flex items-center justify-between mb-2">
                <span
                    className="font-bold uppercase rounded px-2 py-1"
                    style={{ fontSize: "11.5px", letterSpacing: ".5px", background: tint(accent), color: accent }}
                >
                    {title}
                </span>
                <span
                    className="inline-flex items-center justify-center rounded-full"
                    style={{ width: 36, height: 36, background: tint(accent), color: accent }}
                >
                    <Icon size={19} />
                </span>
            </div>

            <div className="text-ink-muted lh-1" style={{ fontSize: "10.5px" }}>Gross Revenue</div>
            <h4 className="font-bold mb-2 mt-1" style={{ color: accent }}>{formatINR(data?.gross)}</h4>

            <Row className="gap-2 items-end pt-2 border-top">
                <MiniStat label="Net" value={formatINR(data?.net)} />
                {showGst && <MiniStat label="GST" value={formatINR(data?.gst)} />}
                <Col xs="auto" className="ml-auto text-right">
                    <div className="text-ink-muted uppercase lh-1" style={{ fontSize: "9.5px", letterSpacing: ".4px" }}>Shipments</div>
                    <div className="font-semibold flex items-center justify-end gap-1" style={{ fontSize: "14px" }}>
                        <MdLocalShipping size={14} className="text-ink-muted" />
                        {formatInt(data?.shipments)}
                    </div>
                </Col>
            </Row>
        </CardBody>
    </Card>
)

const KpiCards = ({ today, yesterday, mtd, todayLabel = "Today", yesterdayLabel = "Yesterday" }) => {
    return (
        <Row className="gap-4 mb-4">
            <Col lg={4} md={6}>
                <StatCard title={todayLabel} icon={MdToday} accent="#556ee6" data={today} showGst />
            </Col>
            <Col lg={4} md={6}>
                <StatCard title={yesterdayLabel} icon={MdHistory} accent="#f1b44c" data={yesterday} />
            </Col>
            <Col lg={4} md={12}>
                <StatCard title="Month to Date" icon={MdCalendarMonth} accent="#34c38f" data={mtd} />
            </Col>
        </Row>
    )
}

export default KpiCards
