import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/authStore";

/**
 * Clears the session and returns to the sign-in screen.
 *
 * Previously this dispatched the Redux logoutUser saga, which was the only
 * genuinely live part of the Redux auth store. It now clears Zustand directly
 * and drops the query cache, so the next person to sign in on this machine
 * cannot briefly see the previous user's cached report results.
 */
const Logout = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const clearSession = useAuthStore((s) => s.clearSession);

  useEffect(() => {
    clearSession();
    queryClient.clear();
    navigate("/login", { replace: true });
  }, [clearSession, queryClient, navigate]);

  return <></>;
};

export default Logout;
