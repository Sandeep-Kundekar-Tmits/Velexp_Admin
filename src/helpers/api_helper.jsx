import axios from "axios";
import { installAxiosAuth } from "@/lib/axiosAuth";

// Auth (Bearer injection + 401 refresh-and-retry) now comes from
// src/lib/axiosAuth.js. This module previously attached those interceptors
// itself — to both a private instance AND the global default — and seeded a
// hardcoded demo JWT that expired in June 2020.
//
// axios.create() does NOT inherit the global instance's interceptors, so this
// instance is wired explicitly. Only helpers/fakebackend_helper.jsx uses these
// helpers; both files are removed in Phase 2 with the Redux auth sagas.
const axiosApi = installAxiosAuth(axios.create({ baseURL: "" }));

export async function get(url, config = {}) {
  return await axiosApi.get(url, { ...config }).then((response) => response.data);
}

export async function post(url, data, config = {}) {
  return axiosApi.post(url, { ...data }, { ...config }).then((response) => response.data);
}

export async function put(url, data, config = {}) {
  return axiosApi.put(url, { ...data }, { ...config }).then((response) => response.data);
}

export async function del(url, config = {}) {
  return await axiosApi.delete(url, { ...config }).then((response) => response.data);
}
