import React, { Suspense, useEffect, useState } from "react";

import { Routes, Route } from "react-router-dom";
// Import Routes all
import { getAuthProtectedRoutes, publicRoutes } from "./routes/index";

// Import all middleware
import Authmiddleware from "./routes/route";

// layouts Format
import VerticalLayout from "./components/VerticalLayout/";
import NonAuthLayout from "./components/NonAuthLayout";

// Import scss
import "./assets/scss/theme.scss";



const App = () => {

  const [routesReady, setRoutesReady] = useState(false);
  // const [authRoutes, setAuthRoutes] = useState([]);

  useEffect(() => {
    // This ensures permissions are checked fresh when the app loads
    // setAuthRoutes(getAuthProtectedRoutes());
    setRoutesReady(true);
  }, []);

  if (!routesReady) {
    return <div>Loading...</div>; // Or your custom loader
  }

  const authRoutes = getAuthProtectedRoutes();
  return (
    <React.Fragment>

      <Routes>
        {publicRoutes.map((route, idx) => (
          <Route
            path={route.path}
            element={<NonAuthLayout>{route.component}</NonAuthLayout>}
            key={idx}
          />
        ))}

        {authRoutes.map((route, idx) => (
          <Route
            path={route.path}
            element={
              <Authmiddleware>
                <VerticalLayout>{route.component}</VerticalLayout>
              </Authmiddleware>
            }
            key={idx}
          />
        ))}
      </Routes>
    </React.Fragment>
  );
};




export default App;
