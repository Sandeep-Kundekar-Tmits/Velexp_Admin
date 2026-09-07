// Permission gating removed — every logged-in user sees every menu and action.
function checkCustomerPermissions() {
  return {
    canCreateUser: true,
    canCreateReport: true,
    canAddPod: true,
    invoice: true,
    canSeeBooking: true,
    canAccessNewFeatures: true,
    isAdmin: true,
    isSuperUser: true,
    canAccessPrivileges: true,
    canTrackAWB: true,
    canApproveRTO: true,
    canAccessITrack: true,
    canAccessOpsReports: true,
    canAccessMisRun: true,
    canAccessAutoReconciliation: true,
    canAccessCustomerPerformance: true,
    canCancelShipments: true,
    canHardDeleteStatus: true,
  };
}

export { checkCustomerPermissions };
