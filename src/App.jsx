import React, { Suspense, useEffect, useState } from "react";

import { Routes, Route } from "react-router-dom";
// Import Routes all
import { getAuthProtectedRoutes, publicRoutes } from "./routes/index";

// Import all middleware
import Authmiddleware from "./routes/route";
import PublicOnlyRoute from "./routes/PublicOnlyRoute";
import { usePrivilegesQuery } from "./features/auth/usePrivilegesQuery";

// layouts Format
import VerticalLayout from "./components/VerticalLayout/";
import NonAuthLayout from "./components/NonAuthLayout";

// Loader
import Loader from "./Loaders/Loader";

// Import scss
// Skote/Bootstrap SCSS removed — replaced by styles/app.css (Tailwind + compat shim)
import "./styles/app.css";



const App = () => {

  const [routesReady, setRoutesReady] = useState(false);

  // Refresh the signed-in user's privileges from the server. Seeded from the
  // stored tree so there is no flash, and written back on success -- which is
  // what finally makes a role change take effect without re-login.
  usePrivilegesQuery();

  useEffect(() => {
    setRoutesReady(true);
  }, []);

  if (!routesReady) {
    return <Loader message="Initializing App..." />;
  }

  const authRoutes = getAuthProtectedRoutes();
  return (
    <React.Fragment>
      <Suspense fallback={<Loader message="Loading Page..." />}>
        <Routes>
          {publicRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <NonAuthLayout>
                  {route.publicOnly ? (
                    <PublicOnlyRoute>{route.component}</PublicOnlyRoute>
                  ) : (
                    route.component
                  )}
                </NonAuthLayout>
              }
              key={idx}
            />
          ))}

          {authRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <Authmiddleware path={route.path}>
                  <VerticalLayout>{route.component}</VerticalLayout>
                </Authmiddleware>
              }
              key={idx}
            />
          ))}
        </Routes>
      </Suspense>
    </React.Fragment>
  );
};




export default App;

