import React from 'react'
import ReactDOM from "react-dom/client"
import App from './App.jsx'
import * as serviceWorker from "./serviceWorker"
import { BrowserRouter } from 'react-router-dom'
import "./i18n"
import { Provider } from 'react-redux'
import store from './store/index.js'
import { ToastContainer } from 'react-toastify'

// Global window.fetch interceptor to inject Bearer token from localStorage
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  try {
    const authUser = localStorage.getItem("authUser");
    if (authUser) {
      const parsedUser = JSON.parse(authUser);
      if (parsedUser && parsedUser.access) {
        if (!options.headers) {
          options.headers = {};
        }
        if (options.headers instanceof Headers) {
          options.headers.set("Authorization", `Bearer ${parsedUser.access}`);
        } else if (Array.isArray(options.headers)) {
          const index = options.headers.findIndex(([key]) => key.toLowerCase() === "authorization");
          if (index !== -1) {
            options.headers[index][1] = `Bearer ${parsedUser.access}`;
          } else {
            options.headers.push(["Authorization", `Bearer ${parsedUser.access}`]);
          }
        } else {
          options.headers["Authorization"] = `Bearer ${parsedUser.access}`;
        }
      }
    }
  } catch (error) {
    console.error("Error setting Authorization header in fetch interceptor:", error);
  }
  return originalFetch(url, options);
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