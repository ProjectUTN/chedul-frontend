import { Navigate, Outlet } from "react-router";
import { useAuth } from "../context/authProvider";

type ProtectedRouteProps = {
  redirectPath?: string;
};

export const ProtectedRoute = ({ redirectPath = "/" }: ProtectedRouteProps) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet />;
};
