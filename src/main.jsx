import React from 'react'
import ReactDOM from "react-dom/client"
import App from './App.jsx'
import { BrowserRouter } from 'react-router-dom'
import "./i18n"
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { installAxiosAuth } from './lib/axiosAuth'
import { queryClient } from './app/queryClient'

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
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Bottom-right, out of the way of the page header and its actions --
            top-center dropped the toast straight over the title bar and, on a
            phone, over whatever you had just tapped.

            theme="dark" so toastify picks its dark surface; the palette and
            the glass panel itself come from .Toastify__toast in
            layout-compat.css. */}
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
        <App />
      </BrowserRouter>
      {/* {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />} */}
    </QueryClientProvider>
  </React.Fragment>,
);