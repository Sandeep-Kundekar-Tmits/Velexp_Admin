import React from 'react'
import ReactDOM from "react-dom/client"
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import "./i18n"
import { Provider } from 'react-redux'
import store from './store/index.js'
import { ToastContainer } from 'react-toastify'
import { installAxiosAuth } from './lib/axiosAuth'

// Auth (Bearer injection + single 401 refresh-and-retry) now lives in
// src/lib/http.js, which every fetch-based API call goes through. The global
// window.fetch monkey-patch that used to sit here has been removed.
//
// Ten screens still call axios directly, so the global axios instance gets
// the same treatment — explicitly, rather than as a side effect of a dead
// helper being imported by a dead saga.
installAxiosAuth()

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