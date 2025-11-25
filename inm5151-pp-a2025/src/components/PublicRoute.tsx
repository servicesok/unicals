import React from "react";
import { Route, Redirect } from "react-router-dom";

interface PublicRouteProps {
  component: React.ComponentType<Record<string, unknown>>;
  isAuthenticated: boolean;
  exact?: boolean;
  path: string;
}

const PublicRoute: React.FC<PublicRouteProps> = ({
  component: Component,
  isAuthenticated,
  ...rest
}) => {
  return (
    <Route
      {...rest}
      render={(props) =>
        !isAuthenticated ? (
          <Component {...props} />
        ) : (
          <Redirect to="/calendrier" />
        )
      }
    />
  );
};

export default PublicRoute;
