import React from 'react'
import ReactDOM from "react-dom/client"
import App from './App.jsx'
import * as serviceWorker from "./serviceWorker"
import { BrowserRouter } from 'react-router-dom'
import "./i18n"
import { Provider } from 'react-redux'
import store from './store/index.js'
import { ToastContainer } from 'react-toastify'

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