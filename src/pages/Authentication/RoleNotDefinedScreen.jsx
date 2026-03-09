import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Alert, Button } from 'reactstrap';

const RoleNotDefinedScreen = () => {
  const navigate = useNavigate()
  const onLogout = () => {
    localStorage.removeItem("authUser")
    navigate("/login")
  }
  return (
    <Container className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <div className="text-center p-4" style={{ maxWidth: '500px' }}>
        <Alert color="danger" className="mb-4">
          <h4 className="alert-heading">Role Not Defined</h4>
          <p>
            Your user role could not be determined. Please contact your system administrator for assistance.
          </p>
          <hr />
          <p className="mb-0">
            You will need to log out and try again with proper credentials.
          </p>
        </Alert>

        <Button
          color="primary"
          onClick={onLogout}
          className="mt-3"
        >
          Log Out
        </Button>
      </div>
    </Container>
  );
};

export default RoleNotDefinedScreen;