import PropTypes from "prop-types";
import React, { useEffect, useState } from "react";
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
import { Link, useNavigate, useParams } from "react-router-dom";
import withRouter from "../../components/Common/withRouter";
import SingleLogo from "../../assets/images/vellocity-express-single-logo.png"
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa";
import usePostApiCall from "../../hooks/usePostApiCall";
import { CONFIRM_NEW_PASSWORD } from "../../api";
import ToasterProvider from "../../helpers/ToasterProvider";

const PasswordResetConfirm = () => {
    // definging the reset confirm password api
    const { apifunc: ResetConfirmPasswordFunc, loading } = usePostApiCall()
    const [newPassword, setnewPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [Error, setError] = useState()
    const navigate = useNavigate()
    // toaster
    const { SucceesToaster, ErrorToaster } = ToasterProvider()

    const { uid, token } = useParams()
    const SubmitForm = async () => {
        console.log(uid, token, "uid, token")
        if (!newPassword) {
            setError("New Password Can't be Empty")
            return
        }
        //  calling the reset password api
        const newPasswordReset = await ResetConfirmPasswordFunc(`${CONFIRM_NEW_PASSWORD}${uid}/${token}/`, {
            "newpassword": newPassword
        })

        if (newPasswordReset?.message) {
            SucceesToaster(newPasswordReset?.message)
            // clearing the local storage
            localStorage.removeItem("authUser")
            //  navigating to login page
            setTimeout(() => {
                navigate("/login")
            }, 2000);
        }
        else {
            ErrorToaster(newPasswordReset?.error)
        }
    }




    return (
        <React.Fragment>
            <div className="account-pages my-12">
                <Container>
                    <Row className="justify-center">
                        <Col md={8} lg={6} xl={5}>
                            {/* Logo Section */}
                            <div className="text-center mb-6">
                                <Link to="/">
                                    <img
                                        src={SingleLogo}
                                        alt="logo"
                                        height="50"
                                    />
                                </Link>
                            </div>

                            {/* Card */}
                            <Card className="border-0 shadow-sm rounded-lg">
                                <CardBody className="p-6 p-sm-5">
                                    <div className="text-center mb-6">
                                        <h4 className="font-bold">Reset Your Password</h4>
                                        <p className="text-ink-muted mb-0">Enter your new password below</p>
                                    </div>

                                    {/* Form */}
                                    <div>
                                        <FormGroup className="mb-6">
                                            <Label for="password" className="form-label font-semibold">
                                                New Password
                                            </Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    name="password"
                                                    value={newPassword}
                                                    className="form-control pr-12"
                                                    placeholder="Enter new password"
                                                    type={showPassword ? "text" : "password"}
                                                    onChange={(e) => setnewPassword(e.target.value)}
                                                    // invalid={!!Error}
                                                />
                                                <button
                                                    onClick={() => setShowPassword(!showPassword)}
                                                    className="absolute bg-transparent border-0"
                                                    style={{
                                                        top: "50%",
                                                        right: "12px",
                                                        transform: "translateY(-50%)",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    {showPassword ?
                                                        <FaRegEye style={{ width: "18px", height: '18px' }} /> :
                                                        <FaRegEyeSlash style={{ width: "18px", height: '18px' }} />
                                                    }
                                                </button>
                                            </div>
                                            <small className="text-danger-500 text-xs mt-1">{Error}</small>
                                        </FormGroup>

                                        <div className="grid gap-2 mt-6">
                                            <button
                                                className="btn btn-primary"
                                                type="button"
                                                onClick={SubmitForm}
                                                disabled={loading}
                                            >
                                                {
                                                    loading ? <div className="flex gap-4 justify-center items-center">
                                                        <Spinner size="sm">
                                                            Loading...
                                                        </Spinner>
                                                        <span>Reseting...</span>
                                                    </div> : "Reset Password"
                                                }

                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-center mt-6">
                                        <p className="text-ink-muted mb-0">
                                            Remember your password?{" "}
                                            <Link to="/login" className="text-brand-500 font-semibold">
                                                Login
                                            </Link>
                                        </p>
                                    </div>
                                </CardBody>
                            </Card>
                        </Col>
                    </Row>
                </Container>
            </div>
        </React.Fragment>
    );
}

export default PasswordResetConfirm;