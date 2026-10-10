// Shared "Reverse Exit" dialog -- used from both EmployeeList.jsx (row
// action) and ViewEmployee.jsx (profile header), same split as
// MarkExitModal. Undoes the employee's most recent exit and reactivates
// their account; no date picker here since the endpoint only takes a remark
// -- it reverses whichever exit is currently on record, not a chosen one.
import { useEffect, useState } from "react"
import { FormGroup, Input, Label } from "@/components/ui"
import SimpleModal from "../SimpleModal"
import usePostApiCall from "../../hooks/usePostApiCall"
import ToasterProvider from "../../helpers/ToasterProvider"
import { REVERSE_EMPLOYEE_EXIT } from "../../api"

const ReverseExitModal = ({ employee, isOpen, setIsOpen, onSuccess }) => {
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    const { apifunc: reverseExit, loading } = usePostApiCall()

    const [remark, setRemark] = useState("")

    useEffect(() => {
        if (isOpen) setRemark("")
    }, [isOpen])

    const handleSubmit = async () => {
        if (!remark.trim()) {
            ErrorToaster("Remark is required")
            return
        }

        const res = await reverseExit(REVERSE_EMPLOYEE_EXIT, {
            employee_code: employee?.employee_code,
            remark: remark.trim(),
        })

        // Same judged-by-message convention as MarkExitModal -- this family
        // of endpoints doesn't use the msg/error keys usePostApiCall's own
        // toast checks for.
        if (res?.result?.is_active === true || /success/i.test(res?.message || "")) {
            SucceesToaster(res?.message || "Employee exit reversed successfully")
            setIsOpen(false)
            onSuccess?.(res?.result)
        } else {
            ErrorToaster(res?.message || res?.detail || res?.error || "Failed to reverse exit")
        }
    }

    return (
        <SimpleModal
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            successButtonName={loading ? "Saving…" : "Reverse Exit"}
            onSuccess={handleSubmit}
        >
            <h5 className="mb-4">Reverse Exit — {employee?.employee_code || ""}</h5>
            <p className="text-ink-muted text-sm mb-4">
                This undoes the exit recorded for {employee?.name || employee?.user_name || "this employee"} and reactivates their account — they will be able to log in again.
            </p>
            <FormGroup>
                <Label>Remark *</Label>
                <Input
                    type="textarea"
                    value={remark}
                    onChange={(e) => setRemark(e.target.value)}
                    placeholder="e.g. Exit marked by mistake"
                />
            </FormGroup>
            {loading && <div className="text-xs text-ink-muted">Saving…</div>}
        </SimpleModal>
    )
}

export default ReverseExitModal
