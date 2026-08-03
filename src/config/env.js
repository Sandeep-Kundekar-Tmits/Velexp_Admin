/**
 * Central runtime configuration.
 *
 * Every value is env-driven with a safe production default, so a build with no
 * `.env` still points at production rather than a developer's machine.
 *
 * To target a different backend locally, create an untracked `.env.local`
 * (Vite loads it with higher precedence than `.env`):
 *
 *   VITE_API_BASE_URL=http://velexp.com:8000
 */

/**
 * Base URL for every API call. No trailing slash.
 * @type {string}
 */
export const BASE_URL = stripTrailingSlash(
  import.meta.env.VITE_API_BASE_URL ?? "https://velexp.com"
);

/**
 * Key used by crypto-js for the MIS Tally password field.
 *
 * NOTE: this is client-side symmetric encryption with a key shipped in the
 * bundle — it is obfuscation, not security. Anyone with devtools can recover
 * it. Tracked for removal; do not add new consumers.
 * @type {string}
 */
export const SECRET_KEY = import.meta.env.VITE_SECRET_KEY ?? "Velexp.admin";

/** @param {string} value */
function stripTrailingSlash(value) {
  return String(value).replace(/\/+$/, "");
}

if (import.meta.env.DEV) {
  // Makes "why is it hitting the wrong server?" a two-second question.
  console.info(`[config] API base URL: ${BASE_URL}`);
}
