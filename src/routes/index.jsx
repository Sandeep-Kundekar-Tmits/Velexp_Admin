import React, { lazy } from "react";
import { Navigate } from "react-router-dom";
import { checkCustomerPermissions } from "../helpers/checkCustomerPermissions";
import RoleNotDefinedScreen from "../pages/Authentication/RoleNotDefinedScreen";

// ✅ Lazy load every page (Vite will automatically code-split these)
// Authentication
import Login from "../pages/Authentication/Login";
import Logout from "../pages/Authentication/Logout";
import Register from "../pages/Authentication/Register";
import ForgetPwd from "../pages/Authentication/ForgetPassword";
import PasswordResetConfirm from "../pages/Authentication/PasswordResetConfirm";

// Dashboard / Reports / Invoices / etc.
import AddPod from "../pages/Dashboard/AddPod";
import AddFranchisee from "../pages/Dashboard/AddFranchisee";
import AdminBooking from "../pages/Dashboard/Reports/AdminBooking";
import UserManagementList from "../pages/Dashboard/UserManagementList";
import ViewUser from "../pages/Dashboard/ViewUser";
import AddUser from "../pages/Dashboard/AddUser";
import UpdateUser from "../pages/Dashboard/UpdateUser";
import CustomerService from "../pages/Dashboard/Reports/CustomerService";
import CustomerServiceEmployee from "../pages/Dashboard/Reports/CustomerServiceEmployee";
import CustomerInvoice from "../pages/Dashboard/Invoices/CustomerInvoice";
import CustomerRateData from "../pages/Dashboard/CustomerRateData";
import INTLRateData from "../pages/Dashboard/INTLRateData";
import MISTally from "../pages/Dashboard/Reports/MISTally";
import EditInvoice from "../pages/Dashboard/Invoices/EditInvoice";
import CorporateInvoice from "../pages/Dashboard/Invoices/CorporateInvoice";
import ManualInvoice from "../pages/Dashboard/Invoices/ManualInvoice";
import RevenueReport from "../pages/Dashboard/Reports/RevenueReport";
import CODReport from "../pages/Dashboard/Reports/CODReport";
import PendingReport from "../pages/Dashboard/Reports/PendingReport";
import CustomerPerformance from "../pages/Dashboard/Reports/CustomerPerformance";
import OperationPerformance from "../pages/Dashboard/Reports/OperationPerformance";
import PickupPerformance from "../pages/Dashboard/Reports/PickupPeformance";
import ShipmentCheckpoint from "../pages/Dashboard/Reports/ShipmentCheckpoint";
import CDUpdate from "../pages/Dashboard/Reports/CDUpdate";
import MarkInvoice from "../pages/Dashboard/Invoices/MarkInvoice";
import PopReconcilation from "../pages/Dashboard/PopReconcilation";
import DelhiveryWarehouse from "../pages/Dashboard/DelhiveryWarehouse";
import PaymentDetails from "../pages/Dashboard/PaymentDeatils";
// import CorporateBooking from "../pages/Dashboard/CorporateBooking";
import RetailPincode from "../pages/Customers/RetailPinocode";
import FranchisePincode from "../pages/Customers/FranchisePincode";
import CorporatePincode from "../pages/Customers/CorporatePincode";
import AirwayBillMiniTable from "../components/AWBPrint/AirwayBillMiniTable";
import AWBPrintPage from "../components/AWBPrint/AWBPrintPage";
import InScanWeight from "../pages/Dashboard/InScanWeight";
import CorporateBooking from "../pages/Dashboard/Bookings/CorporateBooking";
import ServiceProviderBooking from "../pages/Dashboard/Bookings/ServiceProviderBooking";
import LastMileOperations from "../pages/Dashboard/Reports/LastMileOperations";
import CorporateRateData from "../pages/Dashboard/RateData/CorporateRateData";
import RetailRateData from "../pages/Dashboard/RateData/RetailRateData";
import FranchiseRateData from "../pages/Dashboard/RateData/FranchiseRateData";
import FirstMileOperation from "../pages/Dashboard/Reports/FirstMileOperation";
import ODFOperationsPerformance from "../pages/Dashboard/Reports/OFDperationsPerformance";
import OFDperationsPerformance from "../pages/Dashboard/Reports/OFDperationsPerformance";
import EmployeeAttendence from "../pages/Dashboard/EmployeeAttendence";
import AttemptWisePerformance from "../pages/Dashboard/Reports/AttemptWisePerformance";
import CustomerLastMileOperation from "../pages/Dashboard/Reports/customer_Performance/CustomerLastMileOperation";
import CustomerFirstMileOperation from "../pages/Dashboard/Reports/customer_Performance/CustomerFirstMileOperation";
import CustomerOFDOperation from "../pages/Dashboard/Reports/customer_Performance/CustomerOFDOperation";
import SalesBooking from "../pages/Dashboard/Bookings/SalesBooking/SalesBooking";
import CustomerAttemptwisePerformance from "../pages/Dashboard/Reports/customer_Performance/CustomerAttemptwisePerformance";
import AttemptWiseCustomerPickupReport from "../pages/Dashboard/Reports/customer_Performance/AttemptWIseCustomerPickupReport";
import AttemptWiseOperationPickupReport from "../pages/Dashboard/Reports/AttemptWiseOperationPickupReport";
import CustomerLastMileOperationClone from "../pages/Dashboard/Reports/customer_Performance/CustomerLastMileOperationClone";
import CustomerAttemptwisePerformanceClone from "../pages/Dashboard/Reports/customer_Performance/CustomerAttemptwisePerformanceClone";
import Privilege from "../pages/Privileges/Privilege";
import TrackAWB from "../pages/AWBtracking/TrackAWB";
import RtoApproval from "../pages/RTO_Approval/RtoApproval";
import InternationRateData from "../pages/Dashboard/RateData/InternationRateData";
import InternationPincode from "../pages/Dashboard/RateData/InternationPincode";
import PerformanceReport from "../pages/performance/PerformanceReport";
import StatusUpdateAudit from "../pages/Dashboard/Reports/StatusUpdateAudit";


const getPermissions = () => {
  try {
    return checkCustomerPermissions();
  } catch (error) {
    console.error("Permission check failed:", error);
    return {
      canCreateUser: true,
      canAddPod: true,
      canCreateReport: true,
      invoice: true,
      canSeeBooking: true,
    };
  }
};


// Modify your route definitions to use functions
const getAuthProtectedRoutes = () => {
  getPermissions(); const { canCreateUser, canAddPod, canCreateReport, invoice, canSeeBooking } = getPermissions();
  return [
    // POD related routes
    { path: "/add-pod", component: <AddPod /> },

    // Report related routes
    { path: "/admin-booking-download", component: <AdminBooking /> },
    { path: "/customer-service", component: <CustomerService /> },
    { path: "/customer-service-employee", component: <CustomerServiceEmployee /> },
    { path: "/mis-tally", component: <MISTally /> },
    { path: "/revenue-report", component: <RevenueReport /> },
    { path: "/cod-report", component: <CODReport /> },
    { path: "/pending-report", component: <PendingReport /> },
    { path: "/customer-performance", component: <CustomerPerformance /> },
    { path: "/operation-performance", component: <OperationPerformance /> },
    { path: "/pickup-performance", component: <PickupPerformance /> },
    { path: "/status-update", component: <ShipmentCheckpoint /> },
    { path: "/cd-update", component: <CDUpdate /> },
    { path: "/pending-report", component: <PendingReport /> },
    { path: "/last-mile-operation", component: <LastMileOperations /> },
    { path: "/first-mile-operation", component: <FirstMileOperation /> },
    { path: "/ofd-operations-performance", component: <OFDperationsPerformance /> },
    { path: "/attempt-wise-delivery-performance", component: <AttemptWisePerformance /> },
    { path: "/performance-report", component: <PerformanceReport /> },
    { path: "/status-update-audit", component: <StatusUpdateAudit /> },
    { path: "/operation-attempt-wise-pickup-performance", component: <AttemptWiseOperationPickupReport /> },
    // customer performance
    // { path: "/last-mile-customer-performance", component: <CustomerLastMileOperation /> },
    { path: "/last-mile-customer-performance", component: <CustomerLastMileOperationClone /> },
    { path: "/first-mile-customer-performance", component: <CustomerFirstMileOperation /> },
    { path: "/ofd-customer-operations-performance", component: <CustomerOFDOperation /> },
    // { path: "/customer-attempt-wise-delivery-performance", component: <CustomerAttemptwisePerformance /> },
    { path: "/customer-attempt-wise-delivery-performance", component: <CustomerAttemptwisePerformanceClone /> },
    { path: "/customer-attempt-wise-pickup-performance", component: <AttemptWiseCustomerPickupReport /> },
    // User management routes
    { path: "/add-franchisee", component: <AddFranchisee /> },
    { path: "/user-list", component: <UserManagementList /> },
    { path: "/add-user", component: <AddUser /> },
    { path: "/user/:id", component: <ViewUser /> },
    { path: "/edit-user/:id", component: <UpdateUser /> },
    { path: "/customer-rate-data", component: <CustomerRateData /> },
    { path: "/int-rate-data", component: <INTLRateData /> },
    { path: "/retail-pincode", component: <RetailPincode /> },
    { path: "/franchise-pincode", component: <FranchisePincode /> },
    { path: "/corporate-pincode", component: <CorporatePincode /> },
    { path: "/intl-pincode", component: <InternationPincode /> },

    //  rate data
    { path: "/corporate-rate-data", component: <CorporateRateData /> },
    { path: "/retail-rate-data", component: <RetailRateData /> },
    { path: "/franchise-rate-data", component: <FranchiseRateData /> },

    // Invoice routes
    { path: "/franchise_invoice", component: <CustomerInvoice /> },
    { path: "/corporate_invoice", component: <CorporateInvoice /> },
    { path: "/manual_invoice", component: <ManualInvoice /> },
    { path: "/edit_invoice", component: <EditInvoice /> },
    { path: "/mark-invoice-no", component: <MarkInvoice /> },

    // Booking
    { path: "/corporate-booking", component: <CorporateBooking /> },
    { path: "/service-provider-booking", component: <ServiceProviderBooking /> },
    { path: "/sales-booking", component: <SalesBooking /> },

    // Others
    { path: "/delhivery-warehouse", component: <DelhiveryWarehouse /> },
    { path: "/payment-deatils", component: <PaymentDetails /> },
    { path: "/pop-reconcilation", component: <PopReconcilation /> },
    { path: "/awb-print", component: <AWBPrintPage /> },
    { path: "/inscan-weight", component: <InScanWeight /> },
    // Employee attendence
    { path: "/employee-attendance", component: <EmployeeAttendence /> },
    { path: "/privileges", component: <Privilege /> },
    // track awb
    { path: "/tracking", component: <TrackAWB /> },
    // rto approval
    { path: "/rto-approval", component: <RtoApproval /> },
    { path: "/intl-rate-data", component: <InternationRateData /> },
    // Default route
    {
      path: "/",
      exact: true,
      component: <Navigate to="/user-list" />
    },

    // Fallback
    { path: "*", component: <h1>Page Not Found</h1> },
    {
      path: "/",
      exact: true,
      component: <Navigate to={
        canCreateUser ? "/user-list" :
          canAddPod ? "/add-pod" :
            canCreateReport ? "/admin-booking-download" :
              invoice ? "/franchise_invoice" :
                canSeeBooking ? "/corporate-booking" : "/no_role"
      } />
    }

  ];
};


// const getAuthProtectedRoutes = () => {
//   // const { canCreateUser, canAddPod, canCreateReport } = getPermissions();
//   const { canCreateUser, canAddPod, canCreateReport, invoice, canSeeBooking } = getPermissions();
//   return [
//     // POD related routes
//     ...(canAddPod ? [
//       { path: "/add-pod", component: <AddPod /> },
//     ] : []),

//     // Report related routes
//     ...(canCreateReport ? [
//       { path: "/admin-booking-download", component: <AdminBooking /> },
//       { path: "/customer-service", component: <CustomerService /> },
//       { path: "/customer-service-employee", component: <CustomerServiceEmployee /> },
//       { path: "/mis-tally", component: <MISTally /> },
//       { path: "/revenue-report", component: <RevenueReport /> },
//       { path: "/cod-report", component: <CODReport /> },
//       { path: "/pending-report", component: <PendingReport /> },
//       { path: "/customer-performance", component: <CustomerPerformance /> },
//       { path: "/operation-performance", component: <OperationPerformance /> },
//       { path: "/pickup-performance", component: <PickupPeformance /> }
//     ] : []),

//     // User management routes
//     ...(canCreateUser ? [
//       { path: "/add-franchisee", component: <AddFranchisee /> },
//       { path: "/user-list", component: <UserManagementList /> },
//       { path: "/add-user", component: <AddUser /> },
//       { path: "/user/:id", component: <ViewUser /> },
//       { path: "/edit-user/:id", component: <UpdateUser /> },
//       { path: "/customer-rate-data", component: <CustomerRateData /> },
//       { path: "/int-rate-data", component: <INTLRateData /> }
//     ] : []),

//     // User management routes
//     ...(invoice ? [
//       { path: "/franchise_invoice", component: <CustomerInvoice /> },
//       { path: "/corporate_invoice", component: <CorporateInvoice /> },
//       { path: "/manual_invoice", component: <ManualInvoice /> },
//       { path: "/edit_invoice", component: <EditInvoice /> },
//     ] : []),

//     ...((canCreateUser && canAddPod && canCreateReport && invoice) ?
//       [
//         { path: "/franchise_invoice", component: <CustomerInvoice /> },
//         { path: "/edit_invoice", component: <EditInvoice /> },
//         // { path: "/domestic_booking", component: <DomesticBooking /> },

//         // { path: "/delhivery-warehouse", component: <DelhiveryWarehouse /> },
//         // { path: "/payment-deatils", component: <PaymentDeatils /> }
//       ]
//       : []
//     ),
//     ...((canSeeBooking) ? [
//       { path: "/corporate-booking", component: <CorporateBooking /> },
//     ] : []),


//     { path: "/delhivery-warehouse", component: <DelhiveryWarehouse /> },
//     { path: "/payment-deatils", component: <PaymentDeatils /> },

//     // Default route
//     {
//       path: "/",
//       exact: true,
//       component: <Navigate to={
//         canCreateUser ? "/user-list" :
//           canAddPod ? "/add-pod" :
//             canCreateReport ? "/admin-booking-download" :
//               invoice ? "/franchise_invoice" :
//                 canSeeBooking ? "/corporate-booking" : "/no_role"
//       } />
//     },
//   ].filter(Boolean);
// };


// Keep publicRoutes the same
const publicRoutes = [
  { path: "/no_role", component: <RoleNotDefinedScreen /> },
  { path: "/logout", component: <Logout /> },
  { path: "/login", component: <Login /> },
  { path: "/forgot-password", component: <ForgetPwd /> },
  { path: "/register", component: <Register /> },
  { path: "/password-reset-confirm/:uid/:token/", component: <PasswordResetConfirm /> }
];

// export { authProtectedRoutes, publicRoutes };
export { getAuthProtectedRoutes, publicRoutes }
