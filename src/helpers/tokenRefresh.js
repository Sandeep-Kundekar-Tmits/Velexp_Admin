import axios from "axios";
import { toast } from "react-toastify";
import { LOGIN_API_URL, TOKEN_REFRESH_API_URL } from "../api";

// Bare instance, no interceptors attached - can never recursively trigger
// its own 401-retry logic, and isn't affected by the window.fetch patch.
const refreshClient = axios.create();

// Module-level mutex: concurrent 401s share one in-flight refresh instead
// of each firing their own POST /token/refresh/.
let refreshPromise = null;

export function getStoredAuthUser() {
    try {
        const raw = localStorage.getItem("authUser");
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export const getAccessToken = () => getStoredAuthUser()?.access ?? null;
export const getRefreshToken = () => getStoredAuthUser()?.refresh ?? null;

export function isAuthExemptUrl(url) {
    const target = String(url ?? "");
    return target.includes(LOGIN_API_URL) || target.includes(TOKEN_REFRESH_API_URL);
}

export function clearSessionAndRedirectToLogin(message = "Session expired, please log in again.") {
    localStorage.removeItem("authUser");
    toast.error(message, { position: "bottom-right", autoClose: 5000, theme: "light" });
    if (window.location.pathname !== "/login") {
        window.location.href = "/login";
    }
}

async function performRefresh() {
    const refreshToken = getRefreshToken();
    const currentAuthUser = getStoredAuthUser();

    if (!refreshToken) {
        clearSessionAndRedirectToLogin();
        throw new Error("No refresh token available");
    }

    try {
        const { data } = await refreshClient.post(TOKEN_REFRESH_API_URL, { refresh: refreshToken });
        if (!data?.access) throw new Error("Refresh response missing 'access'");

        const updatedAuthUser = {
            ...currentAuthUser,
            access: data.access,
            ...(data.refresh ? { refresh: data.refresh } : {}),
        };
        localStorage.setItem("authUser", JSON.stringify(updatedAuthUser));
        return data.access;
    } catch (err) {
        clearSessionAndRedirectToLogin();
        throw err;
    }
}

export function refreshAccessToken() {
    if (!refreshPromise) {
        refreshPromise = performRefresh().finally(() => {
            refreshPromise = null;
        });
    }
    return refreshPromise;
}
