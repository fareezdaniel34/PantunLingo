import { Navigate, Outlet } from "react-router";
import { getToken, getUser, homeFor, type AppRole } from "../auth";

function ProtectedRoute({ allow }: { allow: AppRole }) {
  const user = getUser();

  if (!user || !getToken()) {
    return <Navigate to="/" replace />;
  }

  if (user.role !== allow) {
    return <Navigate to={homeFor(user.role)} replace />;
  }

  return <Outlet />;
}

export default ProtectedRoute;