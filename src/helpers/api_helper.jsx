import axios from "axios";
import accessToken from "./jwt-token-access/accessToken";
import { refreshAccessToken, isAuthExemptUrl } from "./tokenRefresh";

//pass new generated access token here
const token = accessToken;

//apply base url for axios
const API_URL = "";

const axiosApi = axios.create({
  baseURL: API_URL,
});

axiosApi.defaults.headers.common["Authorization"] = token;

// Function to retrieve the latest Bearer token from localStorage
const getBearerToken = () => {
  try {
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      const parsedUser = JSON.parse(authUser);
      if (parsedUser && parsedUser.access) {
        return `Bearer ${parsedUser.access}`;
      }
    }
  } catch (error) {
    console.error("Error parsing authUser from localStorage", error);
  }
  return null;
};

// Request interceptor for custom axiosApi instance
axiosApi.interceptors.request.use(
  (config) => {
    const token = getBearerToken();
    if (token) {
      config.headers["Authorization"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Request interceptor for default axios instance to cover direct axios imports
axios.interceptors.request.use(
  (config) => {
    const token = getBearerToken();
    if (token) {
      config.headers["Authorization"] = token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// On a 401 (expired/invalid access token), transparently refresh it via the
// stored refresh token and retry the original request once.
function attachAuthRefreshInterceptor(instance) {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;

      if (
        status === 401 &&
        originalRequest &&
        !isAuthExemptUrl(originalRequest.url) &&
        !originalRequest._retry
      ) {
        originalRequest._retry = true;
        try {
          await refreshAccessToken();
          return instance(originalRequest);
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }
      return Promise.reject(error);
    }
  );
}

attachAuthRefreshInterceptor(axiosApi);
attachAuthRefreshInterceptor(axios);

export async function get(url, config = {}) {
  return await axiosApi
    .get(url, { ...config })
    .then((response) => response.data);
}

export async function post(url, data, config = {}) {
  return axiosApi
    .post(url, { ...data }, { ...config })
    .then((response) => response.data);
}

export async function put(url, data, config = {}) {
  return axiosApi
    .put(url, { ...data }, { ...config })
    .then((response) => response.data);
}

export async function del(url, config = {}) {
  return await axiosApi
    .delete(url, { ...config })
    .then((response) => response.data);
}
