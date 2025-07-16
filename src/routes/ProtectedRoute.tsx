import { Navigate, Outlet } from "react-router";

type AuthUser = { id: string; name: string };

type ProtectedRouteProps = {
  user: AuthUser | null;
  redirectPath?: string;
};

export const ProtectedRoute = ({ user, redirectPath = "/" }: ProtectedRouteProps) => {
  if (!user) {
    return <Navigate to={redirectPath} replace />;
  }

  return <Outlet/>;
};
