import PropTypes from 'prop-types';
import React, { useState } from "react";
import { Input, Modal, ModalBody, Spinner } from "reactstrap";

const MisAuthModel = ({ 
  show, 
  onAuthSuccess,  // Renamed from onDeleteClick
  onCloseClick, 
  loading = false 
}) => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!password) {
      setError("Please enter the password");
      return;
    }
    onAuthSuccess(password); // Pass the entered password for validation
  };

  return (
    <Modal size="md" isOpen={show}  centered={true} className="auth-modal">
      <div className="modal-content border-0">
        <ModalBody className="px-4 py-5 text-center">
          <button
            type="button"
            onClick={onCloseClick}
            className="btn-close position-absolute end-0 top-0 m-3"
            aria-label="Close"
          ></button>

          <h4 className="mb-3">Enter Password</h4>
          <p className="text-muted mb-4">
            This page is restricted. Please enter the correct password to continue.
          </p>
          
          <div className="mb-3">
            <Input 
              type="password"
              placeholder="Enter password to access"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(""); // Clear error on typing
              }}
              className={error ? "is-invalid" : ""}
            />
            {error && <div className="invalid-feedback d-block">{error}</div>}
          </div>

          <div className="d-flex justify-content-center gap-3 mt-4">
            <button
              type="button"
              className="btn btn-light w-50"
              onClick={onCloseClick}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary w-50 d-flex justify-content-center align-items-center"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <Spinner size="sm">Loading...</Spinner>
              ) : "Submit"}
            </button>
          </div>
        </ModalBody>
      </div>
    </Modal>
  );
};

MisAuthModel.propTypes = {
  onCloseClick: PropTypes.func,
  onAuthSuccess: PropTypes.func.isRequired, // Now expects password verification
  show: PropTypes.bool,
  loading: PropTypes.bool
};

export default MisAuthModel;