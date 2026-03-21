import React, { lazy } from "react";
import { Navigate } from "react-router-dom";
import { checkCustomerPermissions } from "../helpers/checkCustomerPermissions";

// ✅ Lazy load every page (Vite will automatically code-split these)
// Authentication
const Login = lazy(() => import("../pages/Authentication/Login"));
const Logout = lazy(() => import("../pages/Authentication/Logout"));
const Register = lazy(() => import("../pages/Authentication/Register"));
const ForgetPwd = lazy(() => import("../pages/Authentication/ForgetPassword"));
const PasswordResetConfirm = lazy(() => import("../pages/Authentication/PasswordResetConfirm"));
const RoleNotDefinedScreen = lazy(() => import("../pages/Authentication/RoleNotDefinedScreen"));

// Dashboard / Reports / Invoices / etc.
const AddPod = lazy(() => import("../pages/Dashboard/AddPod"));
const AddFranchisee = lazy(() => import("../pages/Dashboard/AddFranchisee"));
const AdminBooking = lazy(() => import("../pages/Dashboard/Reports/AdminBooking"));
const UserManagementList = lazy(() => import("../pages/Dashboard/UserManagementList"));
const ViewUser = lazy(() => import("../pages/Dashboard/ViewUser"));
const AddUser = lazy(() => import("../pages/Dashboard/AddUser"));
const UpdateUser = lazy(() => import("../pages/Dashboard/UpdateUser"));
const CustomerService = lazy(() => import("../pages/Dashboard/Reports/CustomerService"));
const CustomerServiceEmployee = lazy(() => import("../pages/Dashboard/Reports/CustomerServiceEmployee"));
const CustomerInvoice = lazy(() => import("../pages/Dashboard/Invoices/CustomerInvoice"));
const CustomerRateData = lazy(() => import("../pages/Dashboard/CustomerRateData"));
const INTLRateData = lazy(() => import("../pages/Dashboard/INTLRateData"));
const MISTally = lazy(() => import("../pages/Dashboard/Reports/MISTally"));
const EditInvoice = lazy(() => import("../pages/Dashboard/Invoices/EditInvoice"));
const CorporateInvoice = lazy(() => import("../pages/Dashboard/Invoices/CorporateInvoice"));
const ManualInvoice = lazy(() => import("../pages/Dashboard/Invoices/ManualInvoice"));
const RevenueReport = lazy(() => import("../pages/Dashboard/Reports/RevenueReport"));
const CODReport = lazy(() => import("../pages/Dashboard/Reports/CODReport"));
const PendingReport = lazy(() => import("../pages/Dashboard/Reports/PendingReport"));
const CustomerPerformance = lazy(() => import("../pages/Dashboard/Reports/CustomerPerformance"));
const OperationPerformance = lazy(() => import("../pages/Dashboard/Reports/OperationPerformance"));
const PickupPerformance = lazy(() => import("../pages/Dashboard/Reports/PickupPeformance"));
const ShipmentCheckpoint = lazy(() => import("../pages/Dashboard/Reports/ShipmentCheckpoint"));
const CDUpdate = lazy(() => import("../pages/Dashboard/Reports/CDUpdate"));
const MarkInvoice = lazy(() => import("../pages/Dashboard/Invoices/MarkInvoice"));
const PopReconcilation = lazy(() => import("../pages/Dashboard/PopReconcilation"));
const DelhiveryWarehouse = lazy(() => import("../pages/Dashboard/DelhiveryWarehouse"));
const PaymentDetails = lazy(() => import("../pages/Dashboard/PaymentDeatils"));
const RetailPincode = lazy(() => import("../pages/Customers/RetailPinocode"));
const FranchisePincode = lazy(() => import("../pages/Customers/FranchisePincode"));
const CorporatePincode = lazy(() => import("../pages/Customers/CorporatePincode"));
const AirwayBillMiniTable = lazy(() => import("../components/AWBPrint/AirwayBillMiniTable"));
const AWBPrintPage = lazy(() => import("../components/AWBPrint/AWBPrintPage"));
const InScanWeight = lazy(() => import("../pages/Dashboard/InScanWeight"));
const CorporateBooking = lazy(() => import("../pages/Dashboard/Bookings/CorporateBooking"));
const ServiceProviderBooking = lazy(() => import("../pages/Dashboard/Bookings/ServiceProviderBooking"));
const LastMileOperations = lazy(() => import("../pages/Dashboard/Reports/LastMileOperations"));
const CorporateRateData = lazy(() => import("../pages/Dashboard/RateData/CorporateRateData"));
const RetailRateData = lazy(() => import("../pages/Dashboard/RateData/RetailRateData"));
const FranchiseRateData = lazy(() => import("../pages/Dashboard/RateData/FranchiseRateData"));
const FirstMileOperation = lazy(() => import("../pages/Dashboard/Reports/FirstMileOperation"));
const ODFOperationsPerformance = lazy(() => import("../pages/Dashboard/Reports/OFDperationsPerformance"));
const OFDperationsPerformance = lazy(() => import("../pages/Dashboard/Reports/OFDperationsPerformance"));
const EmployeeAttendence = lazy(() => import("../pages/Dashboard/EmployeeAttendence"));
const AttemptWisePerformance = lazy(() => import("../pages/Dashboard/Reports/AttemptWisePerformance"));
const CustomerLastMileOperation = lazy(() => import("../pages/Dashboard/Reports/customer_Performance/CustomerLastMileOperation"));
const CustomerFirstMileOperation = lazy(() => import("../pages/Dashboard/Reports/customer_Performance/CustomerFirstMileOperation"));
const CustomerOFDOperation = lazy(() => import("../pages/Dashboard/Reports/customer_Performance/CustomerOFDOperation"));
const SalesBooking = lazy(() => import("../pages/Dashboard/Bookings/SalesBooking/SalesBooking"));
const CustomerAttemptwisePerformance = lazy(() => import("../pages/Dashboard/Reports/customer_Performance/CustomerAttemptwisePerformance"));
const AttemptWiseCustomerPickupReport = lazy(() => import("../pages/Dashboard/Reports/customer_Performance/AttemptWIseCustomerPickupReport"));
const AttemptWiseOperationPickupReport = lazy(() => import("../pages/Dashboard/Reports/AttemptWiseOperationPickupReport"));
const CustomerLastMileOperationClone = lazy(() => import("../pages/Dashboard/Reports/customer_Performance/CustomerLastMileOperationClone"));
const CustomerAttemptwisePerformanceClone = lazy(() => import("../pages/Dashboard/Reports/customer_Performance/CustomerAttemptwisePerformanceClone"));
const Privilege = lazy(() => import("../pages/Privileges/Privilege"));
const TrackAWB = lazy(() => import("../pages/AWBtracking/TrackAWB"));
const RtoApproval = lazy(() => import("../pages/RTO_Approval/RtoApproval"));
const InternationRateData = lazy(() => import("../pages/Dashboard/RateData/InternationRateData"));
const InternationPincode = lazy(() => import("../pages/Dashboard/RateData/InternationPincode"));
const PerformanceReport = lazy(() => import("../pages/performance/PerformanceReport"));
const StatusUpdateAudit = lazy(() => import("../pages/Dashboard/Reports/StatusUpdateAudit"));
const ProductivityReport = lazy(() => import("../pages/Dashboard/Reports/ProductivityReport"));



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
    { path: "/productivity-report", component: <ProductivityReport /> },
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
