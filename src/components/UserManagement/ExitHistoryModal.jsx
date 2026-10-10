// Past exit record(s) for one employee (exited, reversed, exited again...).
// Response confirmed against a real call to EMPLOYEE_EXIT_HISTORY:
// { message, employee_code, current_date_of_exit, results: [
//     { id, action: "EXIT" | "REVERSAL", date_of_exit, remark, performed_by, performed_at }, ...
// ] }
import { useEffect, useState } from "react"
import { Badge, Modal, ModalBody, ModalFooter, Button } from "@/components/ui"
import usePostApiCall from "../../hooks/usePostApiCall"
import Loader from "@/Loaders/Loader"
import { formatDisplayDate } from "../../helpers/formatDisplayDate"
import { EMPLOYEE_EXIT_HISTORY } from "../../api"

const orDash = (v) => (v === null || v === undefined || v === "" ? "—" : v)

const ExitHistoryModal = ({ employeeCode, isOpen, setIsOpen }) => {
    const { apifunc: fetchHistory, loading } = usePostApiCall()
    const [rows, setRows] = useState([])
    const [currentDateOfExit, setCurrentDateOfExit] = useState(null)

    useEffect(() => {
        if (isOpen && employeeCode) {
            fetchHistory(EMPLOYEE_EXIT_HISTORY, { employee_code: employeeCode }).then((res) => {
                setRows(Array.isArray(res?.results) ? res.results : [])
                setCurrentDateOfExit(res?.current_date_of_exit || null)
            })
        }
    }, [isOpen, employeeCode, fetchHistory])

    return (
        <Modal isOpen={isOpen} size="lg" centered>
            <ModalBody>
                <div className="mb-4 flex items-center justify-between gap-3">
                    <h5 className="mb-0">Exit History — {employeeCode}</h5>
                    {!loading && (
                        <Badge color={currentDateOfExit ? "danger" : "success"} pill>
                            {currentDateOfExit ? `Exited since ${formatDisplayDate(currentDateOfExit)}` : "Currently Active"}
                        </Badge>
                    )}
                </div>
                {loading ? (
                    <Loader message="Loading exit history…" fullscreen={false} />
                ) : rows.length === 0 ? (
                    <p className="text-ink-muted text-sm">No exit history recorded for this employee.</p>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-sm mb-0">
                            <thead>
                                <tr>
                                    <th>Action</th>
                                    <th>Date of Exit</th>
                                    <th>Remark</th>
                                    <th>Performed By</th>
                                    <th>Performed At</th>
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((row, idx) => (
                                    <tr key={row.id ?? idx}>
                                        <td>
                                            <Badge color={row.action === "EXIT" ? "danger" : "success"} pill>
                                                {orDash(row.action)}
                                            </Badge>
                                        </td>
                                        <td>{formatDisplayDate(row.date_of_exit) || orDash(row.date_of_exit)}</td>
                                        <td>{orDash(row.remark)}</td>
                                        <td>{orDash(row.performed_by)}</td>
                                        <td>{formatDisplayDate(row.performed_at) || orDash(row.performed_at)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </ModalBody>
            <ModalFooter className="border-0">
                <Button color="secondary" onClick={() => setIsOpen(false)}>Close</Button>
            </ModalFooter>
        </Modal>
    )
}

export default ExitHistoryModal
