import PropTypes from "prop-types";
import React, { useState } from "react";
import {
  Row,
  Col,
  Alert,
  Card,
  CardBody,
  Container,
  FormFeedback,
  Input,
  Label,
  Form,
  FormGroup,
  Spinner,
} from "@/components/ui";
import { Link } from "react-router-dom";
import withRouter from "../../components/Common/withRouter";
import SingleLogo from "../../assets/images/vellocity-express-single-logo.png"
// import images
import profile from "../../assets/images/profile-img.png";
import usePostApiCall from "../../hooks/usePostApiCall";
import { USER_RESET_PASSWORD } from "../../api";
import ToasterProvider from "../../helpers/ToasterProvider";


const ForgetPasswordPage = (props) => {
  //meta title
  document.title = "Forget Password";

  //  defining the forgot password api
  const { apifunc: ResetPasswordFunc, loading: ResetpasswordLoading, error: ResetPassowrdError } = usePostApiCall()

  // toaster
  const { SucceesToaster, ErrorToaster } = ToasterProvider()
  const [username, setUserName] = useState("")
  const [Error, setError] = useState()
  const SubmitForm = async () => {
    if (!username) {
      setError("User name is required")
      return
    }

    setError("")
    // calling the reset password api
    const passwordResetted = await ResetPasswordFunc(USER_RESET_PASSWORD, {
      "username": username
    })

    if (passwordResetted?.status === "success") {
      SucceesToaster("A password reset link has been sent to your registered email address.")
      setUserName("")
    }
    else {
      ErrorToaster(passwordResetted?.message)
    }
  }
  return (
    <React.Fragment>
      <div className="home-btn hidden sm:block">
        <Link to="/" className="text-ink">
          <i className="bx bx-home h2" />
        </Link>
      </div>
      <div className="account-pages my-12 pt-sm-5">
        <Container>
          <Row className="justify-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="overflow-hidden">
                <div className="bg-primary-subtlebg-soft-primary">
                  <Row>
                    <Col xs={7}>
                      <div className="text-brand-500 p-6">
                        <h5 className="text-brand-500">Forgot Password</h5>
                        <p>Enter your Username to reset your password.</p>
                      </div>
                    </Col>
                    <Col className="col-5 self-end">
                      <img src={profile} alt="" className="img-fluid" />
                    </Col>
                  </Row>
                </div>
                <CardBody className="pt-0">
                  <div className="auth-logo">
                    <Link to="/" className="auth-logo-light">
                      <div className="avatar-md profile-user-wid mb-6">
                        <span className="avatar-title rounded-full bg-canvas">
                          <img
                            src={SingleLogo}
                            alt=""
                            className="rounded-full"
                            height="34"
                          />
                        </span>
                      </div>
                    </Link>
                    <Link to="/" className="auth-logo-dark">
                      <div className="avatar-md profile-user-wid mb-6">
                        <span className="avatar-title rounded-full bg-canvas">
                          <img
                            src={SingleLogo}
                            alt=""
                            className="rounded-full"
                            height="34"
                          />
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="p-2">


                    {/* form */}
                    <div
                      className="form-horizontal"
                    >
                      <div className="mb-4">
                        <FormGroup>
                          <Label className="form-label">User Name</Label>
                          <Input
                            name="email"
                            value={username}
                            className="form-control"
                            placeholder="Enter User Name"
                            type="text"
                            onChange={(e) => setUserName(e.target.value)}
                            invalid={!!Error}
                          />
                          <FormFeedback>{Error}</FormFeedback>
                        </FormGroup>

                      </div>
                      <Row className="mb-4">
                        <Col className="text-right">
                          <button
                            className="btn btn-primary w-md flex justify-center items-center"
                            type="button"
                            onClick={SubmitForm}
                            disabled={ResetpasswordLoading}
                          >
                            {
                              ResetpasswordLoading ? <div className="flex gap-4 justify-center items-center">
                                <Spinner size="sm">
                                  Loading...
                                </Spinner>
                                <span>Reseting...</span>
                              </div> : "Reset"
                            }

                          </button>
                        </Col>
                      </Row>
                    </div>
                  </div>
                </CardBody>
              </Card>
              <div className="mt-12 text-center">
                <p>
                  Go back to{" "}
                  <Link to="/login" className="font-weight-medium text-brand-500">
                    Login
                  </Link>{" "}
                </p>

              </div>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

ForgetPasswordPage.propTypes = {
  history: PropTypes.object,
};

export default withRouter(ForgetPasswordPage);