import { useEffect, useRef } from "react";
import { Modal } from "bootstrap";

const SimpleModal = ({
  isOpen,
  setIsOpen,
  children,
  cancelButtonName = "Cancel",
  successButtonName = null,
  onCancel,
  onSuccess,
}) => {
  const modalRef = useRef(null);
  const bsModal = useRef(null);

  useEffect(() => {
    bsModal.current = new Modal(modalRef.current, {
      backdrop: "static",
      keyboard: false,
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      bsModal.current.show();
    } else {
      bsModal.current.hide();
    }

    // Listen for close from UI click
    modalRef.current.addEventListener("hidden.bs.modal", () => {
      setIsOpen(false);
    });

  }, [isOpen]);

  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  const handleSuccess = () => {
    onSuccess?.();
  };

  return (
    <div className="modal fade" ref={modalRef} tabIndex="-1">
      <div className="modal-dialog">
        <div className="modal-content p-2 rounded-3 shadow">

          <div className="modal-body">
            {children}
          </div>

          <div className="modal-footer border-0">
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              {cancelButtonName}
            </button>

            {
              successButtonName &&
              <button type="button" className="btn btn-primary" onClick={handleSuccess}>
                {successButtonName}
              </button>
            }
          </div>

        </div>
      </div>
    </div>
  );
};

export default SimpleModal;
