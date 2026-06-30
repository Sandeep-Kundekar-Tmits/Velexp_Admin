// Function to check customer type and control permissions
function checkCustomerPermissions() {
  const authUser = JSON.parse(localStorage.getItem("authUser"));
  const customerType = authUser?.user?.cust_type?.type_of_cust;
  const isAdmin = authUser?.user?.is_admin;

  // Default permissions (most restrictive)
  const defaultPermissions = {
    canCreateUser: false,
    canCreateReport: false,
    canAddPod: false,
    invoice: false,
    canSeeBooking: false,
    canAccessNewFeatures: false,
    isAdmin: false,
    canAccessPrivileges: false,
    canTrackAWB: false,
    canApproveRTO: false,
    canAccessITrack: false,
    canAccessOpsReports: false,
    canAccessAutoReconciliation: false,
    canAccessCustomerPerformance: false,
  };

  // Full access for admin (skip for Analyzer to keep them restricted)
  if (isAdmin && customerType !== "Analyzer") {
    return {
      canCreateUser: true,
      canCreateReport: true,
      canAddPod: true,
      invoice: true,
      canSeeBooking: true,
      canAccessNewFeatures: true,
      isAdmin: true,
      canAccessPrivileges: true,
      canTrackAWB: true,
      canApproveRTO: true,
      canAccessITrack: true,
      canAccessOpsReports: true,
      canAccessAutoReconciliation: true,
      canAccessCustomerPerformance: true,
    };
  }

  // Permission map for customer types
  const permissionMap = {
    sales: {
      canCreateUser: true,
      canCreateReport: false,
      canAddPod: false,
      invoice: false,
      canSeeBooking: false, // sales can see bookings
      canAccessNewFeatures: false,
    },
    "Customer Service": {
      canCreateUser: false,
      canCreateReport: false,
      canAddPod: false,
      invoice: false,
      canSeeBooking: false,
      canAccessNewFeatures: false,
      canAccessPrivileges: false,
      canTrackAWB: true,
      canApproveRTO: true,
      canAccessITrack: true,
      canAccessOpsReports: true,
      canAccessAutoReconciliation: false,
      canAccessCustomerPerformance: true, // only the Customer Performance submenu under Reports
    },
    "Analyzer": {
      canCreateUser: false,
      canCreateReport: true,
      canAddPod: false,
      invoice: false,
      canSeeBooking: false,
      canAccessNewFeatures: false,
      canAccessPrivileges: false,
      canTrackAWB: false,
      canApproveRTO: false,
    },
    pod: {
      canCreateUser: false,
      canCreateReport: false,
      canAddPod: true,
      invoice: false,
      canSeeBooking: false,
    },
    accounting: {
      canCreateUser: false,
      canCreateReport: false,
      canAddPod: false,
      invoice: true,
      canSeeBooking: false,
    },
    "Retail-Franchise": {
      canCreateUser: false,
      canCreateReport: false,
      canAddPod: false,
      invoice: false,
      canSeeBooking: true, // franchise can see bookings
    },
    operations: {
      canCreateUser: false,
      canCreateReport: false,
      canAddPod: false,
      invoice: false,
      canSeeBooking: false,
      canTrackAWB: true,

    }
  };

  // Return matched permissions or default
  const permissions = permissionMap[customerType] || defaultPermissions;

  // If Analyzer, strictly only reports, even if Admin flag is present
  if (customerType === "Analyzer") {
    return { ...permissions, isAdmin: false };
  }

  return { ...permissions, isAdmin };
}

export { checkCustomerPermissions };
