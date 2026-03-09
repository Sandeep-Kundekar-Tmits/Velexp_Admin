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
  };

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

  // Permission map for customer types
  const permissionMap = {
    sales: {
      canCreateUser: true,
      canCreateReport: false,
      canAddPod: false,
      invoice: false,
      canSeeBooking: false, // sales can see bookings
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
      canCreateReport: true,
      canAddPod: false,
      invoice: false,
      canSeeBooking: false,
    }
  };

  // Return matched permissions or default
  return permissionMap[customerType] || defaultPermissions;
}

export { checkCustomerPermissions };
