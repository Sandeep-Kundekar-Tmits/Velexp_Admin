// Book RTO — ops books the return leg for a shipment CS has already flagged RTO_APPROVAL.
import { useEffect, useState } from "react"
import {
    Modal, ModalHeader, ModalBody, ModalFooter,
    Button, Spinner, FormGroup, Label, Input, FormFeedback,
} from "reactstrap"
import { AlertCircle, CheckCircle2 } from "lucide-react"
import { CORPORATE_BULK_BOOKING } from "../../api"

const BookRtoModal = ({ isOpen, toggle, awbNumber, onBooked }) => {
    const [rtoScanAwbno, setRtoScanAwbno] = useState("")
    const [error, setError] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const [loading, setLoading] = useState(false)
    const [bookings, setBookings] = useState(null)

    useEffect(() => {
        if (isOpen) {
            setRtoScanAwbno("")
            setError(false)
            setErrorMsg("")
            setBookings(null)
        }
    }, [isOpen])

    const bookedById = JSON.parse(localStorage.getItem("authUser") || "{}")?.user?.id

    const submit = async () => {
        if (!rtoScanAwbno.trim()) {
            setError(true)
            return
        }
        setError(false)
        setErrorMsg("")
        try {
            setLoading(true)
            const res = await fetch(CORPORATE_BULK_BOOKING, {
                method: "POST",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    RTO_booking: true,
                    Awbno: awbNumber,
                    rto_scan_awbno: rtoScanAwbno.trim(),
                    booked_by_id: bookedById,
                }),
            })
            const json = await res.json()
            if (!res.ok || json?.status === "error") {
                setErrorMsg(json?.message || "RTO booking failed")
                return
            }
            setBookings(Array.isArray(json) ? json : [json])
            onBooked?.()
        } catch (err) {
            setErrorMsg(err?.message || "Network error")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Modal isOpen={isOpen} toggle={toggle} centered>
            <ModalHeader toggle={toggle}>Book RTO — {awbNumber}</ModalHeader>
            <ModalBody>
                {!bookings ? (
                    <>
                        <FormGroup className="mb-0">
                            <Label className="fw-semibold">RTO Scan AWB No.</Label>
                            <Input
                                placeholder="Enter the new AWB scanned for the return leg"
                                value={rtoScanAwbno}
                                invalid={error}
                                onChange={(e) => {
                                    setRtoScanAwbno(e.target.value)
                                    if (e.target.value.trim()) setError(false)
                                }}
                            />
                            <FormFeedback>RTO scan AWB No. is required.</FormFeedback>
                        </FormGroup>

                        {errorMsg && (
                            <div className="d-flex align-items-center gap-2 mt-3 text-danger small">
                                <AlertCircle size={16} /> {errorMsg}
                            </div>
                        )}
                    </>
                ) : (
                    <div className="d-flex flex-column gap-2">
                        {bookings.map((b, i) => (
                            <div key={i} className="d-flex align-items-start gap-2 border rounded p-2">
                                <CheckCircle2 size={18} className="text-success mt-1" />
                                <div>
                                    <div className="fw-semibold">{b?.message?.Reason || "RTO Shipment Booked"}</div>
                                    <div className="text-muted small">
                                        RTO AWB: <span className="fw-semibold">{b?.message?.RTO_AWBNumber}</span>
                                        {" · "}Original: {b?.message?.Original_AWBNumber}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </ModalBody>
            <ModalFooter>
                {!bookings ? (
                    <>
                        <Button color="secondary" outline onClick={toggle} disabled={loading}>Cancel</Button>
                        <Button color="primary" onClick={submit} disabled={loading}>
                            {loading ? <Spinner size="sm" /> : "Book RTO"}
                        </Button>
                    </>
                ) : (
                    <Button color="secondary" onClick={toggle}>Close</Button>
                )}
            </ModalFooter>
        </Modal>
    )
}

export default BookRtoModal
