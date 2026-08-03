import { Modal, ModalBody, ModalFooter, Button } from "@/components/ui";

/**
 * Same props as before, but backed by the Tailwind Modal instead of driving
 * the raw Bootstrap 5 JS API through a ref.
 *
 * The old version instantiated `new Modal(el)` imperatively and re-registered
 * a "hidden.bs.modal" listener on every isOpen change without ever removing
 * it, so listeners accumulated for the life of the component. Declarative
 * rendering removes that class of bug outright.
 *
 * backdrop:"static" / keyboard:false previously meant the dialog could not be
 * dismissed by clicking away or pressing Escape, so `toggle` is intentionally
 * not passed to Modal here — closing stays via the Cancel button.
 */
const SimpleModal = ({
  isOpen,
  setIsOpen,
  children,
  cancelButtonName = "Cancel",
  successButtonName = null,
  size = null, // 'sm' | 'lg' | 'xl'
  onCancel,
  onSuccess,
}) => {
  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  return (
    <Modal isOpen={isOpen} size={size || "md"} centered>
      <ModalBody>{children}</ModalBody>
      <ModalFooter className="border-0">
        <Button color="secondary" onClick={handleCancel}>
          {cancelButtonName}
        </Button>
        {successButtonName && (
          <Button color="primary" onClick={() => onSuccess?.()}>
            {successButtonName}
          </Button>
        )}
      </ModalFooter>
    </Modal>
  );
};

export default SimpleModal;
