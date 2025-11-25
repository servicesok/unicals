import React from "react";
import { Route, Redirect } from "react-router-dom";

interface PrivateRouteProps {
  component: React.ComponentType<Record<string, unknown>>;
  isAuthenticated: boolean;
  exact?: boolean;
  path: string;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({
  component: Component,
  isAuthenticated,
  ...rest
}) => {
  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? <Component {...props} /> : <Redirect to="/login" />
      }
    />
  );
};

export default PrivateRoute;
