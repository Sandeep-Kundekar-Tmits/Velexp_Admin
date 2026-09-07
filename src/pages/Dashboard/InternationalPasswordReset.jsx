import { useEffect, useMemo, useState } from "react"
import axios from "axios"
import {
    Alert, Button, Card, CardBody, Col, FormFeedback, Input, Label,
    Modal, ModalBody, ModalFooter, ModalHeader, Row, Spinner
} from "reactstrap"
import { MdLockReset, MdVisibility, MdVisibilityOff } from "react-icons/md"
import MainHeaderComp from "../../components/MainHeaderCom"
import ToasterProvider from "../../helpers/ToasterProvider"
import { checkCustomerPermissions } from "../../helpers/checkCustomerPermissions"
import { INTERNATIONAL_PASSWORD_BULK_UPDATE } from "../../api"

const MIN_LENGTH = 8

// Returns the first blocking problem with the entered password, or "" when it is acceptable.
const validatePassword = (password) => {
    if (!password) return "New password is required"
    if (password.length < MIN_LENGTH) return `Password must be at least ${MIN_LENGTH} characters`
    if (/\s/.test(password)) return "Password cannot contain spaces"
    return ""
}

const InternationalPasswordReset = () => {
    useEffect(() => { document.title = "International Password Reset" }, [])

    const { SucceesToaster, ErrorToaster } = ToasterProvider()
    // Superuser-only screen — is_admin is not enough to bulk reset international passwords
    const { isSuperUser } = useMemo(() => checkCustomerPermissions(), [])

    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showNew, setShowNew] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false })
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [result, setResult] = useState(null)

    const passwordError = validatePassword(newPassword)
    const confirmError = useMemo(() => {
        if (!confirmPassword) return "Please re-enter the new password"
        if (confirmPassword !== newPassword) return "Passwords do not match"
        return ""
    }, [confirmPassword, newPassword])

    const isValid = !passwordError && !confirmError

    const resetForm = () => {
        setNewPassword("")
        setConfirmPassword("")
        setShowNew(false)
        setShowConfirm(false)
        setTouched({ newPassword: false, confirmPassword: false })
    }

    const handleOpenConfirm = () => {
        setTouched({ newPassword: true, confirmPassword: true })
        if (passwordError) { ErrorToaster(passwordError); return }
        if (confirmError) { ErrorToaster(confirmError); return }
        setConfirmOpen(true)
    }

    const handleUpdatePassword = async () => {
        setLoading(true)
        try {
            const res = await axios.post(
                INTERNATIONAL_PASSWORD_BULK_UPDATE,
                { new_password: newPassword },
                { headers: { "Content-Type": "application/json" }, withCredentials: true }
            )
            const data = res.data || {}
            const message = data.message || data.msg || "International passwords updated successfully"
            setResult({ ...data, message, time: new Date().toLocaleString() })
            SucceesToaster(message)
            setConfirmOpen(false)
            resetForm()
        } catch (err) {
            const data = err.response?.data
            ErrorToaster(
                data?.message || data?.msg || data?.detail || data?.error || "Failed to update international passwords"
            )
        } finally {
            setLoading(false)
        }
    }

    if (!isSuperUser) {
        return (
            <div className="page-content">
                <MainHeaderComp title="International Password Reset" />
                <div className="container-fluid px-3 py-3">
                    <Alert color="danger" className="d-flex align-items-start gap-2 mb-0">
                        <i className="bx bx-lock fs-4"></i>
                        <div>
                            <div className="fw-semibold">Access denied</div>
                            <div className="small">This page is restricted to superusers.</div>
                        </div>
                    </Alert>
                </div>
            </div>
        )
    }

    return (
        <div className="page-content">
            <MainHeaderComp
                title="International Password Reset"
                subTitle="Set a new password for all international accounts in one go"
            />

            <div className="container-fluid px-3 py-3">
                <Row>
                    <Col lg={7}>
                        <Card>
                            <CardBody>
                                <Alert color="warning" className="d-flex align-items-start gap-2">
                                    <i className="bx bx-error-circle fs-4"></i>
                                    <div>
                                        <div className="fw-semibold">This applies to every international account</div>
                                        <div className="small">
                                            The password you set here replaces the existing password for all
                                            international users. Share the new password with them before continuing —
                                            the old one stops working immediately.
                                        </div>
                                    </div>
                                </Alert>

                                <div className="mb-3">
                                    <Label className="fw-bold form-label">New Password</Label>
                                    <div className="d-flex">
                                        <Input
                                            type={showNew ? "text" : "password"}
                                            placeholder="Enter new password"
                                            value={newPassword}
                                            autoComplete="new-password"
                                            invalid={touched.newPassword && !!passwordError}
                                            onBlur={() => setTouched((t) => ({ ...t, newPassword: true }))}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <Button
                                            color="light"
                                            className="ms-2"
                                            type="button"
                                            title={showNew ? "Hide password" : "Show password"}
                                            onClick={() => setShowNew((s) => !s)}
                                        >
                                            {showNew ? <MdVisibilityOff /> : <MdVisibility />}
                                        </Button>
                                    </div>
                                    {touched.newPassword && passwordError ? (
                                        <FormFeedback className="d-block">{passwordError}</FormFeedback>
                                    ) : (
                                        <small className="text-muted">Minimum {MIN_LENGTH} characters, no spaces.</small>
                                    )}
                                </div>

                                <div className="mb-3">
                                    <Label className="fw-bold form-label">Confirm New Password</Label>
                                    <div className="d-flex">
                                        <Input
                                            type={showConfirm ? "text" : "password"}
                                            placeholder="Re-enter new password"
                                            value={confirmPassword}
                                            autoComplete="new-password"
                                            invalid={touched.confirmPassword && !!confirmError}
                                            onBlur={() => setTouched((t) => ({ ...t, confirmPassword: true }))}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === "Enter" && isValid) handleOpenConfirm() }}
                                        />
                                        <Button
                                            color="light"
                                            className="ms-2"
                                            type="button"
                                            title={showConfirm ? "Hide password" : "Show password"}
                                            onClick={() => setShowConfirm((s) => !s)}
                                        >
                                            {showConfirm ? <MdVisibilityOff /> : <MdVisibility />}
                                        </Button>
                                    </div>
                                    {touched.confirmPassword && confirmError && (
                                        <FormFeedback className="d-block">{confirmError}</FormFeedback>
                                    )}
                                </div>

                                <div className="d-flex gap-2">
                                    <Button
                                        color="primary"
                                        onClick={handleOpenConfirm}
                                        disabled={loading || !isValid}
                                    >
                                        <MdLockReset className="me-1" size={18} />
                                        Update Password
                                    </Button>
                                    <Button color="secondary" outline onClick={resetForm} disabled={loading}>
                                        Clear
                                    </Button>
                                </div>
                            </CardBody>
                        </Card>
                    </Col>

                    <Col lg={5}>
                        {result && (
                            <Card>
                                <CardBody>
                                    <div className="d-flex align-items-center gap-2 mb-2">
                                        <i className="bx bx-check-circle text-success fs-4"></i>
                                        <h5 className="m-0">Last Update</h5>
                                    </div>
                                    <p className="mb-2">{result.message}</p>
                                    {result.updated_count !== undefined && (
                                        <div className="small">
                                            <span className="text-muted">Accounts updated: </span>
                                            <span className="fw-semibold">{result.updated_count}</span>
                                        </div>
                                    )}
                                    <div className="small text-muted">Completed at {result.time}</div>
                                </CardBody>
                            </Card>
                        )}
                    </Col>
                </Row>
            </div>

            {/* Confirmation Modal */}
            <Modal isOpen={confirmOpen} toggle={() => !loading && setConfirmOpen(false)} centered size="md">
                <ModalHeader toggle={() => !loading && setConfirmOpen(false)} className="text-danger border-bottom">
                    Confirm Password Reset
                </ModalHeader>
                <ModalBody>
                    <p className="mb-2">
                        This will replace the password for <span className="fw-semibold">all international accounts</span>.
                        Anyone using the current password will be locked out until they are given the new one.
                    </p>
                    <p className="text-muted small mb-0">Are you sure you want to continue?</p>
                </ModalBody>
                <ModalFooter>
                    <Button color="secondary" outline onClick={() => setConfirmOpen(false)} disabled={loading}>
                        Cancel
                    </Button>
                    <Button color="danger" onClick={handleUpdatePassword} disabled={loading}>
                        {loading ? <Spinner size="sm" /> : "Yes, Update Password"}
                    </Button>
                </ModalFooter>
            </Modal>
        </div>
    )
}

export default InternationalPasswordReset
