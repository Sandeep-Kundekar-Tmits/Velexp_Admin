import React from 'react'
import ReactDOM from "react-dom/client"
import App from './App.jsx'
import * as serviceWorker from "./serviceWorker"
import { BrowserRouter } from 'react-router-dom'
import "./i18n"
import { Provider } from 'react-redux'
import store from './store/index.js'
import { ToastContainer } from 'react-toastify'
import { getAccessToken, refreshAccessToken, isAuthExemptUrl } from './helpers/tokenRefresh'

// Global window.fetch interceptor: injects the Bearer token from localStorage,
// and on a 401 (expired/invalid access token) transparently refreshes it via
// the stored refresh token and retries the request once.
const originalFetch = window.fetch;

function applyAuthHeader(options, token) {
  if (!token) return;
  if (!options.headers) {
    options.headers = {};
  }
  if (options.headers instanceof Headers) {
    options.headers.set("Authorization", `Bearer ${token}`);
  } else if (Array.isArray(options.headers)) {
    const index = options.headers.findIndex(([key]) => key.toLowerCase() === "authorization");
    if (index !== -1) {
      options.headers[index][1] = `Bearer ${token}`;
    } else {
      options.headers.push(["Authorization", `Bearer ${token}`]);
    }
  } else {
    options.headers["Authorization"] = `Bearer ${token}`;
  }
}

window.fetch = async function patchedFetch(url, options = {}) {
  try {
    applyAuthHeader(options, getAccessToken());
  } catch (error) {
    console.error("Error setting Authorization header in fetch interceptor:", error);
  }

  const response = await originalFetch(url, options);
  const alreadyRetried = options._retriedAfterRefresh === true;

  if (response.status === 401 && !isAuthExemptUrl(url) && !alreadyRetried) {
    try {
      await refreshAccessToken();
      options._retriedAfterRefresh = true;
      return window.fetch(url, options);
    } catch {
      return response;
    }
  }

  return response;
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.Fragment>
    <Provider store={store}>
      <BrowserRouter>
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="light"
        />
        <App />
      </BrowserRouter>
    </Provider>
  </React.Fragment>,
);

serviceWorker.unregister()