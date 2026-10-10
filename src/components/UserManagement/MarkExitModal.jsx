// Shared "Mark Exit" dialog -- used from both EmployeeList.jsx (row action)
// and ViewEmployee.jsx (profile header), so the form/validation/API call
// lives in one place rather than being duplicated across the two screens.
import { useEffect, useState } from "react"
import DatePicker from "react-datepicker"
import "react-datepicker/dist/react-datepicker.css"
import { FormGroup, Input, Label } from "@/components/ui"
import SimpleModal from "../SimpleModal"
import usePostApiCall from "../../hooks/usePostApiCall"
import ToasterProvider from "../../helpers/ToasterProvider"
import { MARK_EMPLOYEE_EXIT } from "../../api"

const toISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d) }

const MarkExitModal = ({ employee, isOpen, setIsOpen, onSuccess }) => {
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const { apifunc: markExit, loading } = usePostApiCall()

    const [dateOfExit, setDateOfExit] = useState(toISO(new Date()))
    const [remark, setRemark] = useState("")

    useEffect(() => {
        if (isOpen) {
            setDateOfExit(toISO(new Date()))
            setRemark("")
        }
    }, [isOpen])

    const handleSubmit = async () => {
        if (!remark.trim()) {
            ErrorToaster("Remark is required")
            return
        }
        if (!dateOfExit || dateOfExit > toISO(new Date())) {
            ErrorToaster("Date of exit cannot be in the future")
            return
        }

        const res = await markExit(MARK_EMPLOYEE_EXIT, {
            employee_code: employee?.employee_code,
            date_of_exit: dateOfExit,
            remark: remark.trim(),
        })

        // This endpoint's error/success bodies use `message` (and a nested
        // `result`), not the `msg`/`error` keys usePostApiCall's own toast
        // checks -- so success/failure is judged here instead of relying on
        // that generic toast, matching the API's own documented response shape.
        if (res?.result?.is_active === false || /success/i.test(res?.message || "")) {
            SucceesToaster(res?.message || "Employee exit recorded successfully")
            setIsOpen(false)
            onSuccess?.(res?.result)
        } else {
            ErrorToaster(res?.message || res?.detail || res?.error || "Failed to record exit")
        }
    }

    return (
        <SimpleModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            successButtonName={loading ? "Saving…" : "Mark Exit"}
            onSuccess={handleSubmit}
        >
            <h5 className="mb-4">Mark Exit — {employee?.employee_code || ""}</h5>
            <p className="text-ink-muted text-sm mb-4">
                This records the exit for {employee?.name || employee?.user_name || "this employee"} and deactivates their account — they will no longer be able to log in.
            </p>
            <FormGroup>
                <Label>Date of Exit *</Label>
                <br />
                <DatePicker
                    selected={fromISO(dateOfExit)}
                    onChange={(d) => d && setDateOfExit(toISO(d))}
                    dateFormat="dd-MM-yyyy"
                    maxDate={new Date()}
                    className="form-control"
                    wrapperClassName="d-block"
                />
            </FormGroup>
            <FormGroup>
                <Label>Remark *</Label>
                <Input
                    type="textarea"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="e.g. Resigned, last working day"
                />
            </FormGroup>
            {loading && <div className="text-xs text-ink-muted">Saving…</div>}
        </SimpleModal>
    )
}

export default MarkExitModal
