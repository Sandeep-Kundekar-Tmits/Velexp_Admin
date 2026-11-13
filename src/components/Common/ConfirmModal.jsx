// In-app confirmation popup, used in place of window.confirm.
// Render it with `isOpen`; onConfirm runs when the action button is pressed, onCancel on Cancel / close.
import PropTypes from "prop-types"
import { AlertTriangle } from "lucide-react"
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Spinner } from "@/components/ui"

const ConfirmModal = ({
    isOpen,
    title = "Confirm",
    message,
    confirmLabel = "Delete",
    confirmColor = "danger",
    busy = false,
    onConfirm,
    onCancel,
}) => (
    <Modal isOpen={isOpen} toggle={() => !busy && onCancel()} size="sm" centered>
        <ModalHeader toggle={() => !busy && onCancel()}>{title}</ModalHeader>
        <ModalBody>
            <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="mt-0.5 shrink-0 text-danger-500" aria-hidden="true" />
                <div className="text-sm text-ink">{message}</div>
            </div>
        </ModalBody>
        <ModalFooter>
            <Button color="secondary" outline onClick={onCancel} disabled={busy}>Cancel</Button>
            <Button color={confirmColor} onClick={onConfirm} disabled={busy}>
                {busy ? <Spinner size="sm" /> : confirmLabel}
            </Button>
        </ModalFooter>
    </Modal>
)

ConfirmModal.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    title: PropTypes.string,
    message: PropTypes.node,
    confirmLabel: PropTypes.string,
    confirmColor: PropTypes.string,
    busy: PropTypes.bool,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
}

export default ConfirmModal
