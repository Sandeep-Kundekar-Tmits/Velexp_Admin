import React, { useMemo, useRef, useState } from "react"
import { Badge, Button, Card, CardBody, Col, FormFeedback, Input, Label, Nav, NavItem, NavLink, Row, Spinner, TabContent, TabPane } from "reactstrap"
import classnames from "classnames"
import * as XLSX from "xlsx"
import axios from "axios"
import MainHeaderComp from "../../components/MainHeaderCom"
import ToasterProvider from "../../helpers/ToasterProvider"
import { CORPORATE_BOOKING_UPDATE_WEIGHT, CORPORATE_BOOKING_UPDATE_WEIGHT_BULK } from "../../api"
import { MdCloudUpload, MdFileDownload, MdOutlineCheckCircle, MdCancel, MdSave, MdHistory } from "react-icons/md"

const TABS = [
    { id: "single", label: "Single Update" },
    { id: "bulk", label: "Bulk Excel Upload" },
]

// Optional numeric fields shared by the single-AWB form and the bulk excel upload.
// `aliases` lists the excel header spellings (lowercased) accepted for each field.
const EXTRA_FIELDS = [
    { key: "length", aliases: ["length"] },
    { key: "breadth", aliases: ["breadth", "width"] },
    { key: "height", aliases: ["height"] },
    { key: "quantity", aliases: ["quantity", "qty"] },
    { key: "shipment_value", aliases: ["shipment_value", "shipment value", "shipmentvalue"] },
    { key: "volumetric_weight", aliases: ["volumetric_weight", "volumetric weight", "vol_weight", "vol weight"] },
]

const calcVolumetricWeight = (l, b, h) => {
    const ln = parseFloat(l), br = parseFloat(b), ht = parseFloat(h)
    if (!ln || !br || !ht) return ""
    return ((ln * br * ht) / 5000).toFixed(2)
}

const downloadTemplate = () => {
    const ws = XLSX.utils.aoa_to_sheet([
        ["awb", "weight", "length", "breadth", "height", "quantity", "shipment_value", "volumetric_weight"],
        ["AWB1234567890", 9.5, 30, 20, 15, 1, 500, 3],
        ["AWB1234567891", 4, "", "", "", "", "", ""],
    ])
    ws["!cols"] = [{ wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 14 }, { wch: 16 }]
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Update Weight")
    XLSX.writeFile(wb, "update_weight_template.xlsx")
}

// Normalizes a raw parsed excel row (arbitrary header casing) into a validated weight-update item.
const normalizeRow = (row, idx) => {
    const lower = {}
    Object.keys(row).forEach((k) => { lower[String(k).trim().toLowerCase()] = row[k] })

    const awb = String(lower.awb ?? lower.awbno ?? lower["awb no"] ?? lower["awb no."] ?? "").trim()
    const weightRaw = lower.weight
    const weight = weightRaw === "" || weightRaw === undefined || weightRaw === null ? NaN : parseFloat(weightRaw)

    const errors = []
    if (!awb) errors.push("Missing AWB")
    if (isNaN(weight) || weight <= 0) errors.push("Invalid weight")

    const item = { awb, weight }
    EXTRA_FIELDS.forEach(({ key, aliases }) => {
        const raw = aliases.map((a) => lower[a]).find((v) => v !== undefined && v !== "")
        if (raw !== undefined) {
            const n = parseFloat(raw)
            if (!isNaN(n)) item[key] = n
        }
    })

    if (item.volumetric_weight === undefined && item.length && item.breadth && item.height) {
        item.volumetric_weight = Number(((item.length * item.breadth * item.height) / 5000).toFixed(2))
    }

    return { rowNum: idx + 2, ...item, errors }
}

const UpdateWeight = () => {
    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    const fileRef = useRef()

    const [activeTab, setActiveTab] = useState("single")
    const editedBy = useMemo(() => JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.id, [])

    // --- Single update state ---
    const [awb, setAwb] = useState("")
    const [weight, setWeight] = useState("")
    const [length, setLength] = useState("")
    const [breadth, setBreadth] = useState("")
    const [height, setHeight] = useState("")
    const [quantity, setQuantity] = useState("")
    const [shipmentValue, setShipmentValue] = useState("")
    const [volumetricWeight, setVolumetricWeight] = useState("")
    const [singleRemarks, setSingleRemarks] = useState("")
    const [singleLoading, setSingleLoading] = useState(false)
    const [history, setHistory] = useState([])

    // --- Bulk update state ---
    const [fileName, setFileName] = useState("")
    const [parsedRows, setParsedRows] = useState([])
    const [parsing, setParsing] = useState(false)
    const [bulkRemarks, setBulkRemarks] = useState("")
    const [bulkRemarksError, setBulkRemarksError] = useState(false)
    const [bulkLoading, setBulkLoading] = useState(false)
    const [bulkResult, setBulkResult] = useState(null)

    const validRows = parsedRows.filter((r) => r.errors.length === 0)
    const invalidRows = parsedRows.filter((r) => r.errors.length > 0)

    const handleSingleSubmit = async () => {
        if (!awb.trim()) { ErrorToaster("AWB is required"); return }
        const weightNum = parseFloat(weight)
        if (!weight || isNaN(weightNum) || weightNum <= 0) { ErrorToaster("Enter a valid weight"); return }
        if (!singleRemarks.trim()) { ErrorToaster("Remarks is required"); return }

        setSingleLoading(true)
        try {
            const payload = { awb: awb.trim(), weight: weightNum, remarks: singleRemarks.trim(), edited_by: editedBy }
            const extras = { length, breadth, height, quantity, shipment_value: shipmentValue, volumetric_weight: volumetricWeight }
            Object.entries(extras).forEach(([k, v]) => {
                if (v !== "" && v !== undefined && v !== null) {
                    const n = parseFloat(v)
                    if (!isNaN(n)) payload[k] = n
                }
            })
            const res = await axios.post(CORPORATE_BOOKING_UPDATE_WEIGHT, payload, {
                headers: { "Content-Type": "application/json" }, withCredentials: true,
            })
            const data = res.data
            SucceesToaster(data?.message || data?.msg || "Weight updated successfully")
            setHistory((h) => [{ ...payload, time: new Date().toLocaleTimeString() }, ...h])
            setAwb("")
            setWeight("")
            setLength("")
            setBreadth("")
            setHeight("")
            setQuantity("")
            setShipmentValue("")
            setVolumetricWeight("")
            setSingleRemarks("")
        } catch (err) {
            ErrorToaster(err.response?.data?.message || err.response?.data?.msg || err.response?.data?.detail || "Failed to update weight")
        } finally {
            setSingleLoading(false)
        }
    }

    const handleFile = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        setBulkResult(null)
        setParsing(true)
        try {
            const buf = await file.arrayBuffer()
            const wb = XLSX.read(buf, { type: "array" })
            const ws = wb.Sheets[wb.SheetNames[0]]
            const rawRows = XLSX.utils.sheet_to_json(ws, { defval: "" })
            if (!rawRows.length) {
                ErrorToaster("No data rows found in file")
                setParsedRows([])
            } else {
                setParsedRows(rawRows.map(normalizeRow))
                setFileName(file.name)
            }
        } catch {
            ErrorToaster("Could not parse file — use .xlsx or .csv")
            setParsedRows([])
        } finally {
            setParsing(false)
            e.target.value = ""
        }
    }

    const handleBulkSubmit = async () => {
        if (!validRows.length) { ErrorToaster("No valid rows to submit"); return }
        if (!bulkRemarks.trim()) {
            setBulkRemarksError(true)
            ErrorToaster("Batch remarks (in the Bulk Update via Excel section) is required")
            return
        }

        setBulkLoading(true)
        try {
            const items = validRows.map((r) => {
                const item = { awb: r.awb, weight: r.weight }
                EXTRA_FIELDS.forEach(({ key }) => { if (r[key] !== undefined) item[key] = r[key] })
                return item
            })
            const payload = { edited_by: editedBy, remarks: bulkRemarks.trim(), items }
            const res = await axios.post(CORPORATE_BOOKING_UPDATE_WEIGHT_BULK, payload, {
                headers: { "Content-Type": "application/json" }, withCredentials: true,
            })
            setBulkResult(res.data)
            SucceesToaster(res.data?.message || res.data?.msg || `Submitted ${items.length} shipment(s)`)
        } catch (err) {
            ErrorToaster(err.response?.data?.message || err.response?.data?.msg || err.response?.data?.detail || "Bulk update failed")
        } finally {
            setBulkLoading(false)
        }
    }

    const resetBulk = () => {
        setFileName("")
        setParsedRows([])
        setBulkRemarks("")
        setBulkRemarksError(false)
        setBulkResult(null)
    }

    const resultUpdated = bulkResult?.updated || bulkResult?.success || bulkResult?.results || []
    const resultFailed = bulkResult?.failed || bulkResult?.errors || []

    return (
        <React.Fragment>
            <div className="page-content py-0 px-0">
                <div className="bg-white" style={{ position: "sticky", top: 0, zIndex: 1001, width: "100%" }}>
                    <MainHeaderComp title="Update Weight" />
                </div>

                <div className="container-fluid px-3 py-3">

                    <Nav tabs className="mb-3">
                        {TABS.map((t) => (
                            <NavItem key={t.id}>
                                <NavLink
                                    className={classnames({ active: activeTab === t.id })}
                                    onClick={() => setActiveTab(t.id)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {t.label}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    <TabContent activeTab={activeTab}>
                    <TabPane tabId="single">

                    {/* ── Single AWB update ── */}
                    <Card className="shadow-sm border-0 mb-3">
                        <CardBody className="py-3">
                            <Row className="g-3 align-items-end">
                                <Col md={3}>
                                    <Label className="fw-bold small mb-1">AWB <span className="text-danger">*</span></Label>
                                    <Input
                                        placeholder="Enter AWB No."
                                        value={awb}
                                        onChange={(e) => setAwb(e.target.value)}
                                        style={{ fontFamily: "monospace" }}
                                    />
                                </Col>
                                <Col md={2}>
                                    <Label className="fw-bold small mb-1">Weight (kg) <span className="text-danger">*</span></Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                    />
                                </Col>
                                <Col md={2}>
                                    <Label className="fw-bold small mb-1">Length</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={length}
                                        onChange={(e) => {
                                            const v = e.target.value
                                            setLength(v)
                                            setVolumetricWeight(calcVolumetricWeight(v, breadth, height))
                                        }}
                                    />
                                </Col>
                                <Col md={2}>
                                    <Label className="fw-bold small mb-1">Breadth</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={breadth}
                                        onChange={(e) => {
                                            const v = e.target.value
                                            setBreadth(v)
                                            setVolumetricWeight(calcVolumetricWeight(length, v, height))
                                        }}
                                    />
                                </Col>
                                <Col md={3}>
                                    <Label className="fw-bold small mb-1">Height</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={height}
                                        onChange={(e) => {
                                            const v = e.target.value
                                            setHeight(v)
                                            setVolumetricWeight(calcVolumetricWeight(length, breadth, v))
                                        }}
                                    />
                                </Col>
                            </Row>
                            <Row className="g-3 align-items-end mt-1">
                                <Col md={3}>
                                    <Label className="fw-bold small mb-1">Quantity</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                    />
                                </Col>
                                <Col md={4}>
                                    <Label className="fw-bold small mb-1">Shipment Value</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="0.00"
                                        value={shipmentValue}
                                        onChange={(e) => setShipmentValue(e.target.value)}
                                    />
                                </Col>
                                <Col md={5}>
                                    <Label className="fw-bold small mb-1">Volumetric Weight (kg)</Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        placeholder="Auto-calculated from L x B x H / 5000"
                                        value={volumetricWeight}
                                        onChange={(e) => setVolumetricWeight(e.target.value)}
                                    />
                                </Col>
                            </Row>
                            <Row className="g-3 align-items-end mt-1">
                                <Col md={9}>
                                    <Label className="fw-bold small mb-1">Remarks <span className="text-danger">*</span></Label>
                                    <Input
                                        placeholder="Reason for weight update"
                                        value={singleRemarks}
                                        onChange={(e) => setSingleRemarks(e.target.value)}
                                    />
                                </Col>
                                <Col md={3}>
                                    <Button
                                        color="primary"
                                        className="d-flex align-items-center gap-1 fw-bold w-100 justify-content-center"
                                        onClick={handleSingleSubmit}
                                        disabled={singleLoading}
                                    >
                                        {singleLoading ? <><Spinner size="sm" /> Updating…</> : <><MdSave size={16} /> Update Weight</>}
                                    </Button>
                                </Col>
                            </Row>
                        </CardBody>
                    </Card>

                    {/* ── Session history ── */}
                    {history.length > 0 && (
                        <Card className="shadow-sm border-0 mb-3">
                            <CardBody>
                                <h6 className="fw-bold mb-2 d-flex align-items-center gap-1"><MdHistory /> Recent Updates (this session)</h6>
                                <div className="table-responsive">
                                    <table className="table table-sm table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>AWB</th>
                                                <th>Weight (kg)</th>
                                                <th>Length</th>
                                                <th>Breadth</th>
                                                <th>Height</th>
                                                <th>Qty</th>
                                                <th>Shipment Value</th>
                                                <th>Vol. Weight</th>
                                                <th>Remarks</th>
                                                <th>Time</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {history.map((h, i) => (
                                                <tr key={i}>
                                                    <td style={{ fontFamily: "monospace" }}>{h.awb}</td>
                                                    <td>{h.weight}</td>
                                                    <td>{h.length ?? "—"}</td>
                                                    <td>{h.breadth ?? "—"}</td>
                                                    <td>{h.height ?? "—"}</td>
                                                    <td>{h.quantity ?? "—"}</td>
                                                    <td>{h.shipment_value ?? "—"}</td>
                                                    <td>{h.volumetric_weight ?? "—"}</td>
                                                    <td>{h.remarks}</td>
                                                    <td className="text-muted">{h.time}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardBody>
                        </Card>
                    )}

                    </TabPane>
                    <TabPane tabId="bulk">

                    {/* ── Bulk excel update ── */}
                    <Card className="shadow-sm border-0">
                        <CardBody className="py-3">
                            <Row className="g-3 align-items-end">
                                <Col md={5}>
                                    <Label className="fw-bold small mb-1">Upload Excel / CSV <span className="text-danger">*</span></Label>
                                    <div className="d-flex align-items-center gap-2">
                                        <label
                                            htmlFor="update-weight-file-input"
                                            className="d-flex align-items-center gap-2 rounded flex-grow-1 text-truncate px-2 mb-0"
                                            style={{ border: "1.5px dashed #adb5bd", background: "#f8f9fa", cursor: "pointer", height: "38px" }}
                                            onDragOver={(e) => e.preventDefault()}
                                            onDrop={(e) => {
                                                e.preventDefault()
                                                const file = e.dataTransfer.files?.[0]
                                                if (file) handleFile({ target: { files: [file], value: "" } })
                                            }}
                                        >
                                            <MdCloudUpload size={18} className="text-muted flex-shrink-0" />
                                            <span className="text-truncate text-muted" style={{ fontSize: "0.8rem" }}>
                                                {parsing ? "Parsing…" : fileName || "Click or drag & drop .xlsx/.csv"}
                                            </span>
                                            <input id="update-weight-file-input" ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="d-none" onChange={handleFile} />
                                        </label>
                                        <Button color="outline-success" size="sm" onClick={downloadTemplate} className="d-flex align-items-center gap-1 flex-shrink-0" style={{ height: "38px" }}>
                                            <MdFileDownload size={14} /> Template
                                        </Button>
                                    </div>
                                </Col>

                                <Col md={4}>
                                    <Label className="fw-bold small mb-1">Batch Remarks <span className="text-danger">*</span></Label>
                                    <Input
                                        placeholder="Reason for this batch weight update"
                                        value={bulkRemarks}
                                        onChange={(e) => { setBulkRemarks(e.target.value); setBulkRemarksError(false) }}
                                        invalid={bulkRemarksError}
                                    />
                                    {bulkRemarksError && <FormFeedback className="d-block">Batch remarks is required before submitting.</FormFeedback>}
                                </Col>

                                <Col md={3}>
                                    <Button
                                        color="primary"
                                        className="d-flex align-items-center gap-1 fw-bold w-100 justify-content-center"
                                        onClick={handleBulkSubmit}
                                        disabled={bulkLoading || !validRows.length}
                                    >
                                        {bulkLoading
                                            ? <><Spinner size="sm" /> Submitting…</>
                                            : <><MdSave size={15} /> Submit{parsedRows.length > 0 ? ` ${validRows.length} Update${validRows.length !== 1 ? "s" : ""}` : ""}</>}
                                    </Button>
                                </Col>
                            </Row>

                            <p className="text-muted mt-2 mb-0" style={{ fontSize: "0.72rem" }}>
                                Columns: awb, weight, length, breadth, height, quantity, shipment_value, volumetric_weight
                            </p>

                            {parsedRows.length > 0 && (
                                <div className="d-flex align-items-center gap-2 mt-2">
                                    <Badge color="success" className="fw-normal">{validRows.length} valid</Badge>
                                    {invalidRows.length > 0 && <Badge color="danger" className="fw-normal">{invalidRows.length} invalid</Badge>}
                                    <div className="flex-grow-1" />
                                    <Button color="outline-secondary" size="sm" onClick={resetBulk}>Clear</Button>
                                </div>
                            )}

                            {parsedRows.length > 0 && (
                                <div className="table-responsive mt-3" style={{ maxHeight: 280, overflowY: "auto" }}>
                                    <table className="table table-sm table-hover mb-0">
                                        <thead>
                                            <tr>
                                                <th>Row</th>
                                                <th>AWB</th>
                                                <th>Weight</th>
                                                <th>Length</th>
                                                <th>Breadth</th>
                                                <th>Height</th>
                                                <th>Qty</th>
                                                <th>Shipment Value</th>
                                                <th>Vol. Weight</th>
                                                <th>Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {parsedRows.map((r) => (
                                                <tr key={r.rowNum} className={r.errors.length ? "table-danger" : ""}>
                                                    <td>{r.rowNum}</td>
                                                    <td style={{ fontFamily: "monospace" }}>{r.awb || "—"}</td>
                                                    <td>{isNaN(r.weight) ? "—" : r.weight}</td>
                                                    <td>{r.length ?? "—"}</td>
                                                    <td>{r.breadth ?? "—"}</td>
                                                    <td>{r.height ?? "—"}</td>
                                                    <td>{r.quantity ?? "—"}</td>
                                                    <td>{r.shipment_value ?? "—"}</td>
                                                    <td>{r.volumetric_weight ?? "—"}</td>
                                                    <td>
                                                        {r.errors.length
                                                            ? <span className="text-danger small">{r.errors.join(", ")}</span>
                                                            : <span className="text-success small d-flex align-items-center gap-1"><MdOutlineCheckCircle size={14} /> OK</span>}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardBody>
                    </Card>

                    {/* ── Bulk submit result ── */}
                    {bulkResult && (
                        <Card className="shadow-sm border-0 mt-3">
                            <CardBody>
                                <h6 className="fw-bold mb-3">Bulk Update Result</h6>
                                <Row className="g-2 mb-3">
                                    <Col xs={6} md={3}>
                                        <div className="rounded-3 bg-success bg-opacity-10 border border-success border-opacity-25 p-2 text-center">
                                            <div className="fw-bold text-success" style={{ fontSize: "1.5rem" }}>{Array.isArray(resultUpdated) ? resultUpdated.length : resultUpdated}</div>
                                            <div className="small text-success">Updated</div>
                                        </div>
                                    </Col>
                                    <Col xs={6} md={3}>
                                        <div className="rounded-3 bg-danger bg-opacity-10 border border-danger border-opacity-25 p-2 text-center">
                                            <div className="fw-bold text-danger" style={{ fontSize: "1.5rem" }}>{Array.isArray(resultFailed) ? resultFailed.length : resultFailed}</div>
                                            <div className="small text-danger">Failed</div>
                                        </div>
                                    </Col>
                                </Row>

                                {Array.isArray(resultFailed) && resultFailed.length > 0 && (
                                    <div>
                                        <p className="small fw-semibold text-danger mb-1 d-flex align-items-center gap-1">
                                            <MdCancel /> Failed
                                        </p>
                                        <div className="d-flex flex-wrap gap-1">
                                            {resultFailed.map((item, i) => {
                                                const itemAwb = typeof item === "string" ? item : item.awb || item.awbno || JSON.stringify(item)
                                                const reason = typeof item === "object" ? (item.reason || item.message || item.error) : null
                                                return (
                                                    <Badge key={`${itemAwb}-${i}`} color="danger" className="fw-normal" style={{ fontFamily: "monospace" }} title={reason || ""}>
                                                        {itemAwb}{reason ? ` — ${reason}` : ""}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>
                                )}
                            </CardBody>
                        </Card>
                    )}

                    </TabPane>
                    </TabContent>

                </div>
            </div>
        </React.Fragment>
    )
}

export default UpdateWeight
