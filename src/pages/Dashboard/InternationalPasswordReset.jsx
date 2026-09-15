import { useEffect, useState } from "react"
import {
    Alert, Button, Card, CardBody, Col, FormFeedback, Input, Label, Modal,
    ModalBody, ModalFooter, ModalHeader, Row, Spinner,
} from "@/components/ui"
import { MdLockReset, MdVisibility, MdVisibilityOff } from "react-icons/md"
import axios from "axios"
import MainHeaderComp from "../../components/MainHeaderCom"
import ToasterProvider from "../../helpers/ToasterProvider"
import { checkCustomerPermissions } from "../../helpers/checkCustomerPermissions"
import { INTERNATIONAL_PASSWORD_BULK_UPDATE } from "../../api"

const MIN_LENGTH = 8

const InternationalPasswordReset = () => {
    useEffect(() => { document.title = "International Password Reset" }, [])

    const { isSuperUser } = checkCustomerPermissions()
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false })
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [lastUpdate, setLastUpdate] = useState(null)

    const newPasswordError = !newPassword
        ? "New password is required"
        : newPassword.length < MIN_LENGTH
            ? `Must be at least ${MIN_LENGTH} characters`
            : /\s/.test(newPassword)
                ? "Cannot contain spaces"
                : ""

    const confirmPasswordError = !confirmPassword
        ? "Please confirm the new password"
        : confirmPassword !== newPassword
            ? "Passwords do not match"
            : ""

    const isValid = !newPasswordError && !confirmPasswordError

    const handleBlur = (field) => setTouched((t) => ({ ...t, [field]: true }))

    const handleUpdateClick = () => {
        setTouched({ newPassword: true, confirmPassword: true })
        if (!isValid) return
        setConfirmOpen(true)
    }

    const handleConfirm = async () => {
        setSubmitting(true)
        try {
            const res = await axios.post(
                INTERNATIONAL_PASSWORD_BULK_UPDATE,
                { new_password: newPassword },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            )
            const data = res.data
            const message = data?.message || data?.msg || "Password updated for all international accounts"
            SucceesToaster(message)
            setLastUpdate({
                message,
                updatedCount: data?.updated_count,
                at: new Date().toLocaleString(),
            })
            setNewPassword("")
            setConfirmPassword("")
            setTouched({ newPassword: false, confirmPassword: false })
            setConfirmOpen(false)
        } catch (err) {
            ErrorToaster(
                err.response?.data?.message
                || err.response?.data?.msg
                || err.response?.data?.detail
                || err.response?.data?.error
                || "Failed to update password"
            )
        } finally {
            setSubmitting(false)
        }
    }

    // The route table registers every path unconditionally, so hiding the
    // menu entry is not enough on its own to stop a direct URL visit.
    if (!isSuperUser) {
        return (
            <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
                <MainHeaderComp title="International Password Reset" />
                <div className="container-fluid relative z-10 px-4 pb-4">
                    <Alert color="danger" className="mb-0">
                        Access denied — this page is restricted to superusers.
                    </Alert>
                </div>
            </div>
        )
    }

    return (
        <div className="page-content relative min-h-full overflow-x-hidden py-0 antialiased">
            <MainHeaderComp
                title="International Password Reset"
                subTitle="Bulk-reset the password for every international account."
            />

            <div className="container-fluid relative z-10 px-4 pb-4">
                <Alert color="warning" className="mb-4">
                    This replaces the password for <strong>every international account</strong> in one call.
                    The old password stops working immediately for all of them, and there is no undo.
                </Alert>

                <Card className="mb-4">
                    <CardBody className="py-4">
                        <Row className="gap-4">
                            <Col md={5}>
                                <Label className="font-bold text-xs mb-1">
                                    New Password <span className="text-danger-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showNew ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        onBlur={() => handleBlur("newPassword")}
                                        invalid={touched.newPassword && !!newPasswordError}
                                        placeholder="At least 8 characters, no spaces"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNew((s) => !s)}
                                        className="absolute inset-y-0 right-0 flex items-center px-2 text-ink-muted"
                                        style={{ background: "transparent", border: "none" }}
                                        aria-label={showNew ? "Hide password" : "Show password"}
                                        tabIndex={-1}
                                    >
                                        {showNew ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                    </button>
                                </div>
                                {touched.newPassword && newPasswordError && (
                                    <FormFeedback className="block">{newPasswordError}</FormFeedback>
                                )}
                            </Col>

                            <Col md={5}>
                                <Label className="font-bold text-xs mb-1">
                                    Confirm New Password <span className="text-danger-500">*</span>
                                </Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirm ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        onBlur={() => handleBlur("confirmPassword")}
                                        invalid={touched.confirmPassword && !!confirmPasswordError}
                                        placeholder="Re-enter the new password"
                                        className="pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirm((s) => !s)}
                                        className="absolute inset-y-0 right-0 flex items-center px-2 text-ink-muted"
                                        style={{ background: "transparent", border: "none" }}
                                        aria-label={showConfirm ? "Hide password" : "Show password"}
                                        tabIndex={-1}
                                    >
                                        {showConfirm ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
                                    </button>
                                </div>
                                {touched.confirmPassword && confirmPasswordError && (
                                    <FormFeedback className="block">{confirmPasswordError}</FormFeedback>
                                )}
                            </Col>

                            <Col md={2} className="flex items-end">
                                <Button
                                    color="danger"
                                    className="w-full font-bold"
                                    onClick={handleUpdateClick}
                                    disabled={!isValid || submitting}
                                >
                                    {submitting ? <Spinner size="sm" /> : "Update Password"}
                                </Button>
                            </Col>
                        </Row>
                    </CardBody>
                </Card>

                {lastUpdate && (
                    <Card>
                        <CardBody>
                            <h6 className="font-bold mb-2 flex items-center gap-1">
                                <MdLockReset /> Last Update
                            </h6>
                            <p className="text-ink-muted mb-1">{lastUpdate.message}</p>
                            {lastUpdate.updatedCount !== undefined && (
                                <p className="text-ink-muted mb-1">
                                    Accounts updated: <strong className="text-ink">{lastUpdate.updatedCount}</strong>
                                </p>
                            )}
                            <p className="text-ink-muted text-xs mb-0">{lastUpdate.at}</p>
                        </CardBody>
                    </Card>
                )}
            </div>

            <Modal isOpen={confirmOpen} toggle={() => setConfirmOpen(false)} centered size="md">
                <ModalHeader toggle={() => setConfirmOpen(false)} className="text-danger-500 border-bottom">
                    Confirm Password Reset
                </ModalHeader>
                <ModalBody>
                    <p className="text-ink-muted mb-0">
                        This immediately replaces the password for every international account.
                        The old password will stop working right away for all of them. This cannot be undone.
                    </p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => setConfirmOpen(false)}>
                        Cancel
                    </Button>
                    <Button color="danger" onClick={handleConfirm} disabled={submitting}>
                        {submitting ? <Spinner size="sm" /> : "Yes, Update Password"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default InternationalPasswordReset
