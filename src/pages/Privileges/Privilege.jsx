import React, { useEffect, useState } from "react";
import { RiDeleteBinLine } from "react-icons/ri";
import MainHeaderComp from "../../components/MainHeaderCom";
import AssignPrivilegesScreen from "../../components/Privileges/AssignPrivilegesScreen";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import { DELETE_PRIVILEGE, GET_ALL_PRIVILEGES } from "../../api";
import usePostApiCall from "../../hooks/usePostApiCall";
import SimpleModal from "../../components/SimpleModal";
import ToasterProvider from "../../helpers/ToasterProvider";


// Sample API response passed as prop or can be fetched via API
// const data = [...]

const groupByEmployee = (data) => data;

const menuLabelMap = {
    "/masters/unit": "Unit Master",
    "/masters/supplier": "Supplier Master",
    "/masters/item": "Item Master",
    "/masters/m4-bitt": "M4 Bitt",
    "/masters/drill-bitt": "Drill Bitt",
    "/masters/visitor": "Visitor Master",
    "/masters/equipment": "Equipment Master",
    "/masters/equipment-reading": "Equipment Reading Master",
    "/masters/department": "Department Master",
    "/masters/employee": "Employee Master",
    "/masters/sty-w": "STY_W",
    "/transaction/supply": "Supply",
    "/transaction/purchase-order": "Purchase Order",
    "/transaction/wiresa": "Wire SA",
    "/transaction/gangwise": "Gangwise",
    "/reports/purchase-report": "Purchase Report",
    "/reports/daily": "Daily Report",
};

const getSection = (menu) => {
    if (menu.startsWith("/masters")) return "Masters";
    if (menu.startsWith("/transaction")) return "Transaction";
    if (menu.startsWith("/reports")) return "Reports";
    return "Other";
};
let data = [
    {
        "role_id": 1,
        "role_name": "Manager",
        "menus": [
            {
                "menu_id": 1,
                "menu_name": "Master",
                "menu_url": "#",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": [
                    {
                        "menu_id": 11,
                        "menu_name": "Co-loaders",
                        "menu_url": "/coloaders/"
                    },
                    {
                        "menu_id": 12,
                        "menu_name": "Vendor and Vendor Vehicle",
                        "menu_url": "/vendors-vendor_vahicles/"
                    },
                    {
                        "menu_id": 13,
                        "menu_name": "Service Centre",
                        "menu_url": "/service-center/"
                    },
                    {
                        "menu_id": 14,
                        "menu_name": "Status",
                        "menu_url": "/status/"
                    },
                    {
                        "menu_id": 15,
                        "menu_name": "Pincode",
                        "menu_url": "/pincode/"
                    },
                    {
                        "menu_id": 16,
                        "menu_name": "Package Type",
                        "menu_url": "/package-type/"
                    },
                    {
                        "menu_id": 17,
                        "menu_name": "Exceptions",
                        "menu_url": "/exception/"
                    },
                    {
                        "menu_id": 18,
                        "menu_name": "Exceptions Status",
                        "menu_url": "/exception-status/"
                    }
                ]
            }
        ]
    },
    {
        "role_id": 3,
        "role_name": "Admin",
        "menus": [
            {
                "menu_id": 10,
                "menu_name": "Dashboard",
                "menu_url": "#",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": []
            },
            {
                "menu_id": 1,
                "menu_name": "Master",
                "menu_url": "#",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": [
                    {
                        "menu_id": 11,
                        "menu_name": "Co-loaders",
                        "menu_url": "/coloaders/"
                    },
                    {
                        "menu_id": 12,
                        "menu_name": "Vendor and Vendor Vehicle",
                        "menu_url": "/vendors-vendor_vahicles/"
                    },
                    {
                        "menu_id": 13,
                        "menu_name": "Service Centre",
                        "menu_url": "/service-center/"
                    },
                    {
                        "menu_id": 14,
                        "menu_name": "Status",
                        "menu_url": "/status/"
                    },
                    {
                        "menu_id": 15,
                        "menu_name": "Pincode",
                        "menu_url": "/pincode/"
                    },
                    {
                        "menu_id": 16,
                        "menu_name": "Package Type",
                        "menu_url": "/package-type/"
                    },
                    {
                        "menu_id": 17,
                        "menu_name": "Exceptions",
                        "menu_url": "/exception/"
                    },
                    {
                        "menu_id": 18,
                        "menu_name": "Exceptions Status",
                        "menu_url": "/exception-status/"
                    }
                ]
            },
            {
                "menu_id": 25,
                "menu_name": "Create Out-Going Manifest",
                "menu_url": "/create-out-going-manifest/",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": []
            },
            {
                "menu_id": 2,
                "menu_name": "User management",
                "menu_url": "#",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": [
                    {
                        "menu_id": 19,
                        "menu_name": "Designation",
                        "menu_url": "/designations/"
                    },
                    {
                        "menu_id": 20,
                        "menu_name": "Department",
                        "menu_url": "/departments/"
                    },
                    {
                        "menu_id": 21,
                        "menu_name": "Employee",
                        "menu_url": "/employee/"
                    }
                ]
            },
            {
                "menu_id": 3,
                "menu_name": "Pickup Requests",
                "menu_url": "/pickup-request/",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": []
            },
            {
                "menu_id": 4,
                "menu_name": "Planning",
                "menu_url": "#",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": [
                    {
                        "menu_id": 22,
                        "menu_name": "Allocations",
                        "menu_url": "/allocations/"
                    },
                    {
                        "menu_id": 23,
                        "menu_name": "Manifest",
                        "menu_url": "/manifest/"
                    }
                ]
            },
            {
                "menu_id": 5,
                "menu_name": "Shipment Arrival",
                "menu_url": "/shipment-arrival/",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": []
            },
            {
                "menu_id": 6,
                "menu_name": "Bag Management",
                "menu_url": "#",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": [
                    {
                        "menu_id": 24,
                        "menu_name": "Bag Creation",
                        "menu_url": "/bag-creation/"
                    },
                    {
                        "menu_id": 25,
                        "menu_name": "Create Out-Going Manifest",
                        "menu_url": "/create-out-going-manifest/"
                    },
                    {
                        "menu_id": 26,
                        "menu_name": "Bag Arrival",
                        "menu_url": "/bag-arrival/"
                    }
                ]
            },
            {
                "menu_id": 7,
                "menu_name": "RTO Booking",
                "menu_url": "/rto_booking/",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": []
            },
            {
                "menu_id": 8,
                "menu_name": "Raise Exception",
                "menu_url": "/raise-exception/",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": []
            },
            {
                "menu_id": 9,
                "menu_name": "Others",
                "menu_url": "#",
                "has_fullacess": true,
                "can_view": true,
                "can_save": true,
                "can_update": true,
                "can_delete": true,
                "children": [
                    {
                        "menu_id": 27,
                        "menu_name": "Pickup Preference",
                        "menu_url": "/pickup-preferences/"
                    }
                ]
            },
            {
                "menu_id": 28,
                "menu_name": "Shipment & Bag Tracking",
                "menu_url": "/tracking/",
                "has_fullacess": true,
                "can_view": false,
                "can_save": false,
                "can_update": false,
                "can_delete": false,
                "children": []
            }
        ]
    }
]

const Privilege = () => {


    const [showAddPrivleges, setShowAddPriveleges] = useState(false)
    const [AllPrivilegesData, setAllPrivilegesData] = useState([])
    const [showDeletePopup, setDeletePopup] = useState(false)
    const { ErrorToaster, SucceesToaster } = ToasterProvider()
    //  defining the api for the get all privileges
    const { apifunc: GetAllPrivileges, data: AllPrivileges, loading: PrivilegesLoading } = useGetApiCall()
    // defining the api for delete role
    const { apifunc: DeleteRole, loading: DeleteRoleLoading } = usePostApiCall()

    useEffect(() => {
        //  calling the get all privileges api
        GetAllPrivileges(GET_ALL_PRIVILEGES)
    }, [])

    useEffect(() => {
        if (AllPrivileges) {
            setAllPrivilegesData(AllPrivileges)
        }

    }, [AllPrivileges])
    const onButtonClick = () => {
        setShowAddPriveleges(!showAddPrivleges)
    }
    const OnDeleteRole = async (role) => {
        let isDeleted = await DeleteRole(DELETE_PRIVILEGE, { "role_id": role?.role_id })
        if (isDeleted?.status === 1) {
            SucceesToaster(isDeleted?.message)
            GetAllPrivileges(GET_ALL_PRIVILEGES)
        }
        else {
            ErrorToaster(isDeleted?.message)
        }
    }
    return (
        <div className="container mt-2">
            <MainHeaderComp title="Privileges"
                extraFields={<button className="btn btn-danger" onClick={() => onButtonClick()}>{showAddPrivleges ? "LookUp" : "New Privileges"}</button>} />
            {/* <div className="d-flex justify-content-between align-items-center mb-3">
                <h4>Privileges</h4>
                <button className="btn btn-danger">New Privileges</button>
            </div> */}
            <div className="" style={{ height: "85vh", overflowY: "auto" }}>
                {
                    !showAddPrivleges ? <>
                        {
                            AllPrivilegesData.map((role) => (
                                <div key={role.role_id} className="card mb-2 shadow-sm">
                                    <div className="card-body border shadow-sm d-flex position-relative">

                                        {/* Role name */}
                                        <h6 className="mb-0" style={{ fontSize: "16px" }}>
                                            {role.role_name}
                                        </h6>

                                        <div style={{ marginLeft: "30px", width: "100%" }}>

                                            {/* Delete button */}
                                            <div
                                                className="position-absolute"
                                                style={{ top: "10px", right: "10px" }}
                                            >
                                                <button className="btn btn-outline-danger p-2" onClick={() => {
                                                    OnDeleteRole(role)
                                                }}>
                                                    <RiDeleteBinLine />
                                                </button>
                                            </div>

                                            {/* Menus */}
                                            {role.menus.map((menu) => (
                                                <div key={menu.menu_id} className="mb-3">

                                                    {/* Parent menu */}
                                                    <h6 className="text-black" style={{ fontWeight: "normal" }}>
                                                        {menu.menu_name}
                                                    </h6>

                                                    {/* Children menus */}
                                                    <div className="d-flex flex-wrap gap-2">
                                                        {menu.children.length > 0 ? (
                                                            menu.children.map((child) => (
                                                                <span
                                                                    key={child.menu_id}
                                                                    className="badge rounded-pill text-black bg-success bg-opacity-10 border-success px-3 py-2"
                                                                    style={{ fontSize: "14px" }}
                                                                >
                                                                    {child.menu_name}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="badge rounded-pill text-muted border px-3 py-2">
                                                                No sub-menus
                                                            </span>
                                                        )}
                                                    </div>

                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))
                        }

                    </> : <AssignPrivilegesScreen callBack={() => {
                        setShowAddPriveleges(false)
                        GetAllPrivileges(GET_ALL_PRIVILEGES)
                    }} />
                }
            </div>

            {/* popup */}
            {/* {
                showDeletePopup &&
                <SimpleModal
                    isOpen={true}
                    setIsOpen={setDeletePopup}
                    cancelButtonName="Close"
                    successButtonName="Delete"
                    // onCancel={handleCancel}
                    // onSuccess={handleSuccess}
                >
                    <h5>Are you sure?</h5>
                    <p>You want to delete this Privilege.</p>
                </SimpleModal>
            } */}
        </div>
    );
};

export default Privilege;
