import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../model/AuthContext";
import { PATHS } from "../../app/router/paths";

export default function RequireAuth({ children, role }) {
  const { isAuthenticated, userRole } = useAuth();
  const location = useLocation();

  if (isAuthenticated && (!role || userRole === role)) return children;

  if (isAuthenticated && role && userRole !== role) {
    return (
      <Navigate
        to={PATHS.LOGIN}
        replace
      />
    );
  }

  return (
    <Navigate
      to={PATHS.LOGIN}
      replace
      state={{ from: location?.pathname || PATHS.HOME }}
    />
  );
}

