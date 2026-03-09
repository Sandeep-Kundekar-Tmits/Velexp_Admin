import React, { useState } from 'react';
import { Badge, Button, Card, CardBody, CardFooter, CardHeader, CardTitle, ListGroup, ListGroupItem } from 'reactstrap';
import SimpleModal from '../SimpleModal';
import usePostApiCall from '../../hooks/usePostApiCall';
import { UPDATE_ACTIVE_STATUS } from '../../api';

const UserProfile = ({ user, setProfileData, userId }) => {
    const [isOpen, setIsOpen] = useState(false);

    const { apifunc, data, error, loading } = usePostApiCall(() => {
        setIsOpen(false)
    })
    let isAdmin = JSON.parse(localStorage.getItem("authUser"))?.user?.is_admin || false
    return (
        <Card className="mb-4 shadow-sm border-0 rounded" style={{ overflow: 'hidden' }}>
            <CardHeader className="bg-primary text-white py-3">
                <CardTitle tag="h4" className="mb-0 d-flex align-items-center text-white">
                    <i className="fas  fa-user-circle me-2 text-white"></i>
                    User Profile
                </CardTitle>
            </CardHeader>
            <CardBody className="p-0">
                <ListGroup flush>
                    <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
                        <span className="fw-bold text-muted">Username</span>
                        <span className="text-dark">{user?.username || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
                        <span className="fw-bold text-muted">Email</span>
                        <span className="text-dark">{user?.email || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
                        <span className="fw-bold text-muted">Phone</span>
                        <span className="text-dark">{user?.phone || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
                        <span className="fw-bold text-muted">Account No</span>
                        <span className="text-dark">{user?.accno || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
                        <span className="fw-bold text-muted">Secret Code</span>
                        <span className="text-dark">{user?.domestic_secretcode || "--"}</span>
                    </ListGroupItem>

                    <ListGroupItem className="d-flex justify-content-between align-items-center p-3 ">
                        <span className="fw-bold font-size-16 text-muted">Is Active    <Badge color="success" pill>{user?.is_active ? "true"
                            : "false"}</Badge>
                        </span>

                        {/* toggle button */}
                        {
                            isAdmin && <div className="d-flex align-items-center gap-2">
                                <div className="form-check form-switch">
                                    <input
                                        className="form-check-input"
                                        type="checkbox"
                                        name="insurance"
                                        onClick={() => {
                                            setIsOpen(true)
                                        }}
                                        checked={user?.is_active}
                                        style={{
                                            width: "40px",   // increase width
                                            height: "20px",  // increase height
                                            cursor: "pointer",
                                        }}
                                    />
                                </div>
                            </div>
                        }




                    </ListGroupItem>
                    <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
                        <span className="fw-bold text-muted">Customer Type</span>
                        <Badge color="info">{user?.cust_type?.type_of_cust || "--"}</Badge>
                    </ListGroupItem>
                    <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
                        <span className="fw-bold text-muted">Billing Type</span>
                        <span className="text-dark">{user?.billing_type || "--"}</span>
                    </ListGroupItem>
                    <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
                        <span className="fw-bold text-muted">KYC Approved</span>
                        {user?.kyc_approved ? (
                            <Badge color="success" pill>Yes</Badge>
                        ) : (
                            <Badge color="danger" pill>No</Badge>
                        )}
                    </ListGroupItem>
                    <ListGroupItem className="d-flex justify-content-between align-items-center p-3">
                        <span className="fw-bold text-muted">Industry</span>
                        <span className="text-dark">{user?.account_created_info?.industry || "--"}</span>
                    </ListGroupItem>
                </ListGroup>
            </CardBody>
            {/* <CardFooter className="bg-light d-flex justify-content-end">
            <Button color="primary" size="sm" className="me-2">
                <i className="fas fa-edit me-1"></i> Edit
            </Button>
            <Button color="secondary" size="sm">
                <i className="fas fa-download me-1"></i> Export
            </Button>
        </CardFooter> */}

            <SimpleModal
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                cancelButtonName="No"
                successButtonName="Yes, Confirm"
                onCancel={() => setIsOpen(false)}
                onSuccess={async () => {
                    // api call
                    let user_updated = await apifunc(UPDATE_ACTIVE_STATUS, {
                        "user_id": userId,
                        "is_active": !user?.is_active

                    })

                    console.log(user_updated, "user_updated")

                    if (user_updated) {
                        setProfileData((profile) => {
                            return {
                                ...profile,
                                is_active: !user?.is_active
                            }
                        })
                        setIsOpen(false)
                    }
                }}
            >
                <h6>Are you sure you want to Change the Active Status?</h6>
                {/* <p className="text-muted small">This action cannot be undone.</p> */}
            </SimpleModal>
        </Card>
    )

};

export default UserProfile;
