import PropTypes from 'prop-types'
import React from "react"
import { Modal, ModalBody, Spinner } from "@/components/ui"

const DeleteModal = ({ show, onDeleteClick, onCloseClick, loading = false }) => {
  return (
    <Modal size="md" isOpen={show} toggle={onCloseClick} centered={true} className="delete-modal">
      <div className="modal-content border-0">
        <ModalBody className="px-6 py-12 text-center">
          <button
            type="button"
            onClick={onCloseClick}
            className="btn-close absolute end-0 top-0 m-4"
            aria-label="Close"
          ></button>

          {/* <div className="icon-container mb-6 mx-auto">
            <div className="icon-wrapper bg-danger-500 bg-opacity-10 text-danger-500">
              <i className="mdi mdi-alert-circle-outline"></i>
            </div>
          </div> */}

          <h4 className="mb-4">Confirm Deletion</h4>
          <p className="text-ink-muted mb-6">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>

          <div className="flex justify-center gap-4">
            <button
              type="button"
              className="btn btn-light w-1/2"
              onClick={onCloseClick}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger w-1/2 flex justify-center items-center"
              onClick={onDeleteClick}
            >
              {
                loading ? <Spinner size="sm">
                  Loading...
                </Spinner> : "Delete"
              }

            </button>
          </div>
        </ModalBody>
      </div>
    </Modal>
  )
}

DeleteModal.propTypes = {
  onCloseClick: PropTypes.func,
  onDeleteClick: PropTypes.func,
  show: PropTypes.any
}

export default DeleteModal