import { combineReducers } from "redux";

// Front
import Layout from "./layout/reducer";

// Authentication
import Login from "./auth/login/reducer";
import Account from "./auth/register/reducer";
import ForgetPassword from "./auth/forgetpwd/reducer";
import Profile from "./auth/profile/reducer";


const rootReducer = combineReducers({
  // public
  Layout,
  Login,
  Account,
  ForgetPassword,
  Profile,
});

export default rootReducer;
// import { createStore, combineReducers, applyMiddleware } from 'redux';
// import thunk from 'redux-thunk';
// import franchiseReducer from './franchiseReducer';
// import { validationMiddleware } from './middleware';

// const rootReducer = combineReducers({
//   franchise: franchiseReducer
// });

// const store = createStore(
//   rootReducer,
//   applyMiddleware(thunk, validationMiddleware)
// );

// export default store;