import PropTypes from 'prop-types'
import React from "react"
import { Modal, ModalBody, Spinner } from "reactstrap"

const DeleteModal = ({ show, onDeleteClick, onCloseClick, loading = false }) => {
  return (
    <Modal size="md" isOpen={show} toggle={onCloseClick} centered={true} className="delete-modal">
      <div className="modal-content border-0">
        <ModalBody className="px-4 py-5 text-center">
          <button
            type="button"
            onClick={onCloseClick}
            className="btn-close position-absolute end-0 top-0 m-3"
            aria-label="Close"
          ></button>

          {/* <div className="icon-container mb-4 mx-auto">
            <div className="icon-wrapper bg-danger bg-opacity-10 text-danger">
              <i className="mdi mdi-alert-circle-outline"></i>
            </div>
          </div> */}

          <h4 className="mb-3">Confirm Deletion</h4>
          <p className="text-muted mb-4">
            Are you sure you want to delete this item? This action cannot be undone.
          </p>

          <div className="d-flex justify-content-center gap-3">
            <button
              type="button"
              className="btn btn-light w-50"
              onClick={onCloseClick}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-danger w-50 d-flex justify-content-center align-items-center"
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