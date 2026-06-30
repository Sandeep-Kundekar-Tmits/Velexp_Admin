import React, { useEffect } from "react";
import PropTypes from "prop-types";
import { Link, useNavigate } from "react-router-dom";
import withRouter from "../../components/Common/withRouter";

import {
  Row,
  Col,
  CardBody,
  Card,
  Alert,
  Container,
  Form,
  Input,
  FormFeedback,
  Label,
} from "reactstrap";
// import images
import CompanyLogo from "../../assets/images/vellocity-express-logo.png";
import { useState } from "react";
import usePostApiCall from "../../hooks/usePostApiCall";
import { LOGIN_API_URL } from "../../api";
import { checkCustomerPermissions } from "../../helpers/checkCustomerPermissions";
import { ClipLoader } from "react-spinners"
import SingleLogo from "../../assets/images/vellocity-express-single-logo.png"

const Login = (props) => {
  const getPermissions = (customerType, isAdmin) => {
    // Default permissions (safe fallback)
    const defaultPermissions = {
      canCreateUser: false,
      canCreateReport: false,
      canAddPod: false,
      invoice: false,
      canSeeBooking: false,
    };

    // If no customer type, assume full (or safe defaults depending on your logic)
    if (!customerType) {
      return {
        canCreateUser: true,
        canCreateReport: true,
        canAddPod: true,
        invoice: true,
        canSeeBooking: true,
      };
    }

    // Full access for admin
    if (isAdmin) {
      return {
        canCreateUser: true,
        canCreateReport: true,
        canAddPod: true,
        invoice: true,
        canSeeBooking: true,
      };
    }

    // Handle permissions based on customer type
    if (customerType === "sales") {
      return {
        canCreateUser: true,
        canCreateReport: false,
        canAddPod: false,
        invoice: false,
        canSeeBooking: false, // ✅ Sales can view bookings
      };
    } else if (customerType === "pod") {
      return {
        canCreateUser: false,
        canAddPod: true,
        canCreateReport: false,
        invoice: false,
        canSeeBooking: false,
      };
    } else if (customerType === "accounting") {
      return {
        canCreateUser: false,
        canAddPod: false,
        canCreateReport: false,
        invoice: true,
        canSeeBooking: false,
      };
    } else if (customerType === "Retail-Franchise") {
      return {
        canCreateUser: false,
        canCreateReport: false,
        canAddPod: false,
        invoice: false,
        canSeeBooking: true, // ✅ Retail-Franchise can see bookings
      };
    }
    else if (customerType === "operations" || customerType === "Analyzer") {
      return {
        canCreateUser: false,
        canAddPod: false,
        canCreateReport: true,
        invoice: false,
        canSeeBooking: false,
      };
    }

    else {
      console.error("Unknown customer type:", customerType);
      return defaultPermissions;
    }
  };



  const { apifunc: login, data, error: apiError, loading } = usePostApiCall()
  const navigate = useNavigate()
  const [loginInfo, setLoginInfo] = useState({
    username: "",
    password: ""
  })

  const [error, setErrors] = useState({})
  const onInputChnage = (e) => {
    const { value, name } = e.target

    setLoginInfo({
      ...loginInfo,
      [name]: value
    })
  }
  useEffect(() => {
    //meta title
    document.title = "Velexp Admin Login";
  }, []);

  const onSubmitForm = async () => {
    const newError = {};

    if (!loginInfo.username) {
      newError.username = "User name is required";
    }

    if (!loginInfo.password) {
      newError.password = "Password is required";
    }

    setErrors(newError);

    if (Object.keys(newError).length === 0) {
      // Submit the form logic here
      console.log("Form submitted", loginInfo);
      // api call
      let userData = await login(LOGIN_API_URL, loginInfo)

      if (userData?.status === "success") {
        if (userData?.user?.is_staff === false) {
          navigate("/login");
          return
        }

        localStorage.setItem("authUser", JSON.stringify(userData));
        const customerType = userData?.user?.cust_type?.type_of_cust
        const isAdmin = userData?.user?.is_admin
        const { canCreateUser, canAddPod, canCreateReport, invoice, canSeeBooking } = getPermissions(customerType, isAdmin);


        // Determine the route based on permissions
        let route = canCreateUser ? "/user-list" :
          canAddPod ? "/add-pod" :
            canCreateReport ? "/last-mile-customer-performance" :
              invoice ? "/franchise_invoice"
                : canSeeBooking ? "/corporate-booking" : "/no_role";

        // Fallback for roles (e.g. Customer Service / operations) that have no
        // landing flag above but do have granular menu access. Avoids /no_role dead-end.
        if (route === "/no_role") {
          const perms = checkCustomerPermissions();
          if (perms.canAccessOpsReports) route = "/pending-report";
          else if (perms.canTrackAWB) route = "/tracking";
          else if (perms.canAccessPrivileges) route = "/privileges";
        }

        // Navigate to the determined route
        navigate(route);
      }

    }
  };


  // useEffect(() => {
  //   if (data && data?.status) {
  //     // Successful login
  //     navigate("/user-list");
  //   }
  // }, [data])
  return (
    <React.Fragment>
      <div className="account-pages my-5 pt-sm-5">
        <Container>
          <Row className="justify-content-center">
            <Col md={8} lg={6} xl={5}>
              <Card className="overflow-hidden">
                <div className="bg-primary-subtle">
                  <Row>
                    <Col xs={7}>
                      <div className="text-primary p-4">
                        <h5 className="text-primary">Welcome Back !</h5>
                        <p>Sign up to Velocity.</p>
                      </div>
                    </Col>
                    <Col className="col-5 align-self-center">
                      <img src={CompanyLogo} alt="" className="img-fluid" />
                    </Col>
                  </Row>
                </div>
                <CardBody className="pt-0">
                  <div className="auth-logo">
                    <Link to="/" className="auth-logo-dark">
                      <div className="avatar-md profile-user-wid mb-4">
                        <span className="avatar-title rounded-circle bg-light">
                          <img
                            src={SingleLogo}
                            alt=""
                            className="rounded-circle"
                            height="34"
                          />
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="p-2">
                    <div
                      className="form-horizontal"
                    >
                      <div className="mb-3">
                        <Label className="form-label">User</Label>
                        <Input
                          name="username"
                          className="form-control"
                          placeholder="Enter User"
                          type="email"
                          value={loginInfo.username}
                          invalid={!!error?.username}
                          onChange={onInputChnage}
                        />
                        <FormFeedback type="invalid">
                          {error?.username}
                        </FormFeedback>
                      </div>


                      <div className="mb-3">
                        <Label className="form-label">Password</Label>
                        <Input
                          name="password"
                          autoComplete="off"
                          type="password"
                          placeholder="Enter Password"
                          value={loginInfo.password}
                          invalid={!!error?.password}
                          onChange={onInputChnage}
                        />
                        <FormFeedback type="invalid">
                          {error?.password}
                        </FormFeedback>
                      </div>
                      <div className="mt-3 d-grid">
                        <button
                          className="btn btn-primary btn-block d-flex justify-content-center align-items-center"
                          type="button"
                          onClick={!loading && onSubmitForm}
                        >
                          {
                            loading ? <ClipLoader size={28} /> : "Log In"
                          }
                        </button>
                        {
                          apiError && <div className="text-danger mt-2 text-start fw-bold">
                            {apiError.error}
                          </div>
                        }
                      </div>
                    </div>
                  </div>
                  {/* <Link to="/forgot-password"> Forgot password</Link> */}
                </CardBody>
              </Card>
            </Col>
          </Row>
        </Container>
      </div>
    </React.Fragment>
  );
};

export default withRouter(Login);

Login.propTypes = {
  history: PropTypes.object,
};
