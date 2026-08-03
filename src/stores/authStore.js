/**
 * Authentication state.
 *
 * INTEROP CONTRACT — do not "improve" the stored shape.
 * This store persists to localStorage["authUser"] using the *exact* JSON the
 * login endpoint returns: { status, access, refresh, user, privileges }.
 * Several places still read that key directly rather than going through this
 * store — helpers/tokenRefresh.js, helpers/checkMenuAccess.js, ProfileMenu,
 * routes/route.jsx, the logout saga — and the running legacy app in the other
 * worktree shares the same origin and therefore the same key. Changing the
 * shape logs everyone out and breaks the refresh flow.
 *
 * The custom storage adapter below is what keeps that promise: zustand's
 * `persist` normally wraps state as { state, version }, which would not be
 * readable by any of those consumers.
 */
import { create } from "zustand";
import { persist } from "zustand/middleware";

const STORAGE_KEY = "authUser";

const emptySession = {
  status: null,
  access: null,
  refresh: null,
  user: null,
  privileges: [],
};

/**
 * Identity adapter: the persisted value IS the login response, with no
 * zustand envelope around it.
 */
const authUserStorage = {
  getItem: (name) => {
    try {
      const raw = localStorage.getItem(name);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed ? { state: parsed } : null;
    } catch {
      return null;
    }
  },
  setItem: (name, value) => {
    // value.state is already the login-response shape.
    localStorage.setItem(name, JSON.stringify(value.state));
  },
  removeItem: (name) => localStorage.removeItem(name),
};

export const useAuthStore = create(
  persist(
    (set) => ({
      ...emptySession,

      /** Store the raw login response verbatim. */
      setSession: (loginResponse) =>
        set({
          status: loginResponse?.status ?? null,
          access: loginResponse?.access ?? null,
          refresh: loginResponse?.refresh ?? null,
          user: loginResponse?.user ?? null,
          privileges: loginResponse?.privileges ?? [],
        }),

      /** Replace privileges after a live refetch, leaving tokens alone. */
      setPrivileges: (privileges) => set({ privileges: privileges ?? [] }),

      clearSession: () => {
        set({ ...emptySession });
        // persist() would write the emptied object back; the key must go
        // entirely, because every legacy consumer treats "key present" as
        // "logged in".
        localStorage.removeItem(STORAGE_KEY);
      },
    }),
    {
      name: STORAGE_KEY,
      storage: authUserStorage,
      // Only session data is persisted; actions are recreated on load.
      partialize: (state) => ({
        status: state.status,
        access: state.access,
        refresh: state.refresh,
        user: state.user,
        privileges: state.privileges,
      }),
    }
  )
);

/** True when a session exists. Mirrors the legacy "is the key present" check. */
export const selectIsAuthenticated = (state) => !!state.access || !!state.user;

/**
 * Non-reactive read, for use outside React (interceptors, guards).
 * Falls back to localStorage so it works before the store has hydrated.
 */
export function getAuthSnapshot() {
  const state = useAuthStore.getState();
  if (state.user || state.access) return state;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...emptySession, ...JSON.parse(raw) } : emptySession;
  } catch {
    return emptySession;
  }
}
