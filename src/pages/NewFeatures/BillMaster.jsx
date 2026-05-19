import React, { useState, useEffect, useMemo } from "react";
import {
    Container,
    TabContent,
    TabPane,
    Nav,
    NavItem,
    NavLink,
    Button,
    Row,
    Col,
    Card,
    CardBody,
    Spinner
} from "reactstrap";
import classnames from "classnames";
import MainHeaderComp from "../../components/MainHeaderCom";
import { useMultiExcelExport } from "../../hooks/useMultiExcelExport";
import { useGetApiCall } from "../../hooks/useGetApiCall";
import usePostApiCall from "../../hooks/usePostApiCall";
import { 
    CORPORATE_BILLING_CONFIG,
    GET_CORPORATE_CUSTOMER_PINCODE_LIST,
    GET_CUSTOMER_RATES,
    CORPORATE_BILLING_VAS,
    CORPORATE_CUSTOMERS_LIST
} from "../../api";
import Select from "react-select";
import { customStyles } from "../../helpers/CustomStyle";

// Import sub-components
import CustomerProductConfig from "./CustomerProductConfig";
import CorporatePincode from "../Customers/CorporatePincodeUpload";
import CorporateRateData from "../Customers/CorporateRateUpload";
import VASConfig from "./VASConfig";
import SearchableDropdown from "../../components/Common/SearchableDropdown";
import { FaFileExcel } from "react-icons/fa";

const BillMaster = () => {
    const [activeTab, setActiveTab] = useState("1");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [customerOptions, setCustomerOptions] = useState([]);
    const [isFetching, setIsFetching] = useState(false);

    const { apifunc: fetchUsers, loading: usersLoading } = useGetApiCall();
    const { apifunc: fetchConfig } = useGetApiCall();
    const { apifunc: fetchPincode } = useGetApiCall();
    const { apifunc: fetchRate } = useGetApiCall();
    const { apifunc: fetchVAS } = useGetApiCall();

    const { exportMultiToExcel, isExporting } = useMultiExcelExport();

    useEffect(() => {
        const loadUsers = async () => {
            const data = await fetchUsers(CORPORATE_CUSTOMERS_LIST);
            if (data?.user) {
                const options = data.user
                    .filter(ele => ele?.cust_type?.type_of_cust === "Corporate" || ele?.cust_type?.type_of_cust === "Franchise")
                    .map(ele => ({
                        name: `${ele?.customer_name || ""} - ${ele?.username}`,
                        label: `${ele?.customer_name || ""} - ${ele?.username}`,
                        id: ele?.id,
                        value: ele?.customer_name || ele?.username
                    }));
                setCustomerOptions(options);
            }
        };
        loadUsers();
    }, []);

    const toggleTab = (tab) => {
        if (activeTab !== tab) setActiveTab(tab);
    };

    const handleCustomerChange = (val) => {
        setSelectedCustomer(val);
    };

    const handleDownloadExcel = async () => {
        if (!selectedCustomer) {
            alert("Please select a customer first");
            return;
        }

        setIsFetching(true);
        try {
            const customerId = selectedCustomer.id;
            const customerName = selectedCustomer.value;

            // Fetch all data in parallel using new endpoints
            const [configRes, pincodeRes, rateRes, vasRes] = await Promise.all([
                fetchConfig(`${CORPORATE_BILLING_CONFIG}?customer_id=${customerId}`),
                fetchPincode(`${GET_CORPORATE_CUSTOMER_PINCODE_LIST}?customer_id=${customerId}`),
                fetchRate(`${GET_CUSTOMER_RATES}?customer_id=${customerId}`),
                fetchVAS(`${CORPORATE_BILLING_VAS}?customer_id=${customerId}`)
            ]);

            // Format Config Data
            const configData = (configRes?.results || (Array.isArray(configRes) ? configRes : [])).map(item => ({
                "Customer ID": item.customer_id,
                "Customer Name": item.customer_name,
                "Product Name": item.product_name,
                "Billing Mode": item.billing_mode,
                "Vol. Divisor": item.volumetric_divisor,
                "FSC %": item.fsc_percentage,
                "Docket Charge": item.docket_charge,
                "RTO Multiplier": item.rto_multiplier,
                "GST Rate": item.gst_rate,
                "Show Detailed Charges": item.show_detailed_extra_charges ? "Yes" : "No"
            }));

            // Format Pincode Data (Flatten Services)
            const rawPincodes = pincodeRes?.result || (Array.isArray(pincodeRes) ? pincodeRes : (pincodeRes?.results || []));
            const pincodeData = rawPincodes.map(p => {
                const base = {
                    "Pincode": p.pincode,
                    "City": p.city,
                    "State": p.state,
                    "Region": p.region,
                    "Legacy Zone": p.legacy_zone,
                    "Is Metro": p.is_metro ? "Yes" : "No",
                    "Zone Tag": p.zone_tag
                };
                if (p.services && p.services.length > 0) {
                    return p.services.map(s => ({
                        ...base,
                        "Product": s.product_name,
                        "Can Pickup": s.can_pickup ? "Yes" : "No",
                        "Can Deliver": s.can_deliver ? "Yes" : "No",
                        "Is ODA": s.is_oda ? "Yes" : "No"
                    }));
                }
                return [base];
            }).flat();

            // Format Rate Data
            const rateData = (rateRes?.results || (Array.isArray(rateRes) ? rateRes : [])).map(item => ({
                "Product": item.product_name,
                "Weight Min": item.weight_min,
                "Weight Max": item.weight_max || "∞",
                "Origin": item.origin_zone,
                "Destination": item.dest_zone,
                "Zone Type": item.zone_type,
                "Base Weight": item.base_weight,
                "Base Rate": item.base_rate,
                "Inc. Unit": item.incremental_unit,
                "Inc. Rate": item.incremental_rate,
                "Billing Type": item.billing_type
            }));

            // Format VAS Data
            const vasData = (vasRes?.results || (Array.isArray(vasRes) ? vasRes : [])).map(item => ({
                "Charge Name": item.charge_name,
                "Charge Type": item.charge_type,
                "Category": item.charge_category,
                "Value": item.value,
                "Min Value": item.min_value,
                "Is Mandatory": item.is_mandatory ? "Yes" : "No",
                "Is Default": item.is_default_applied ? "Yes" : "No",
                "Product": item.product_name
            }));

            const sheets = [
                { sheetName: "Customer Config", data: configData },
                { sheetName: "Pincode", data: pincodeData },
                { sheetName: "Rate", data: rateData },
                { sheetName: "VAS", data: vasData }
            ];

            await exportMultiToExcel(sheets, `Customer_Billing_${customerName}`);
        } catch (error) {
            console.error("Export error:", error);
            alert("Failed to export data");
        } finally {
            setIsFetching(false);
        }
    };

    return (
        <React.Fragment>
            <div className="page-content py-0 px-0">
                <div className="bg-white" style={{ position: 'sticky', top: '0px', zIndex: 1001, width: '100%' }}>
                    <MainHeaderComp 
                        title="Customer Billing" 
                        extraFields={
                            <div className="d-flex align-items-center gap-2">
                                <div style={{ width: "300px" }}>
                                    <SearchableDropdown
                                        locations={customerOptions}
                                        value={selectedCustomer ? selectedCustomer.name : "select"}
                                        onChange={handleCustomerChange}
                                        placeholder={usersLoading ? "Loading..." : "Select Customer"}
                                    />
                                </div>
                                <Button 
                                    color="success" 
                                    onClick={handleDownloadExcel} 
                                    disabled={!selectedCustomer || isExporting || isFetching}
                                    className="d-flex align-items-center gap-1"
                                >
                                    {(isExporting || isFetching) ? <Spinner size="sm" /> : <FaFileExcel />}
                                    Download Excel
                                </Button>
                            </div>
                        }
                    />
                </div>

                <div className="container-fluid px-0">
                    <Nav tabs className="nav-tabs-custom nav-justified bg-light border-bottom">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => toggleTab("1")}
                                style={{ cursor: "pointer" }}
                            >
                                <span className="d-block d-sm-none"><i className="fas fa-home"></i></span>
                                <span className="d-none d-sm-block">Customer Config</span>
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => toggleTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                <span className="d-block d-sm-none"><i className="far fa-user"></i></span>
                                <span className="d-none d-sm-block">Pincode</span>
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => toggleTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                <span className="d-block d-sm-none"><i className="far fa-envelope"></i></span>
                                <span className="d-none d-sm-block">Rate</span>
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "4" })}
                                onClick={() => toggleTab("4")}
                                style={{ cursor: "pointer" }}
                            >
                                <span className="d-block d-sm-none"><i className="fas fa-cog"></i></span>
                                <span className="d-none d-sm-block">VAS</span>
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <TabContent activeTab={activeTab} className="p-0">
                        <TabPane tabId="1">
                            <CustomerProductConfig 
                                externalCustomerId={selectedCustomer?.id || ""} 
                                onCustomerChange={handleCustomerChange}
                                hideHeader={true}
                            />
                        </TabPane>
                        <TabPane tabId="2">
                            <CorporatePincode 
                                externalCustomer={selectedCustomer} 
                                onCustomerChange={handleCustomerChange}
                                hideHeader={true}
                            />
                        </TabPane>
                        <TabPane tabId="3">
                            <CorporateRateData 
                                externalCustomer={selectedCustomer} 
                                onCustomerChange={handleCustomerChange}
                                hideHeader={true}
                            />
                        </TabPane>
                        <TabPane tabId="4">
                            <VASConfig 
                                externalCustomerId={selectedCustomer?.id || ""} 
                                onCustomerChange={handleCustomerChange}
                                hideHeader={true}
                            />
                        </TabPane>
                    </TabContent>
                </div>
            </div>
        </React.Fragment>
    );
};

export default BillMaster;
