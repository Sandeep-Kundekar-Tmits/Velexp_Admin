import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Alert, Button } from "@/components/ui";

const RoleNotDefinedScreen = () => {
  const navigate = useNavigate()
  // Routes to the dedicated /logout screen rather than clearing the session
  // here directly -- this used to only remove the localStorage key, leaving
  // the in-memory Zustand auth store populated. PublicOnlyRoute (wrapping
  // /login) checks that in-memory store, saw the user as still
  // authenticated, and bounced them straight back to /no_role -- Logout
  // looked like it did nothing. /logout clears both the store and the
  // query cache before navigating, so reuse it instead of duplicating that.
  const onLogout = () => {
    navigate("/logout")
  }
  return (
    <Container className="flex flex-col items-center justify-center" style={{ minHeight: '100vh' }}>
      <div className="text-center p-6" style={{ maxWidth: '500px' }}>
        <Alert color="danger" className="mb-6">
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
          className="mt-4"
        >
          Log Out
        </Button>
      </div>
    </Container>
  );
};

export default RoleNotDefinedScreen;