import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/authProvider";

type ProtectedRouteProps = {
  redirectPath?: string;
};

export const ProtectedRoute = ({
  redirectPath = "/login",
}: ProtectedRouteProps) => {
  const { user, cargando } = useAuth();
  const location = useLocation();

  if (cargando) {
    return <div className="pantalla-carga">Cargando...</div>;
  }

  if (!user) {
    return <Navigate to={redirectPath} replace state={{ desde: location.pathname }} />;
  }

  return <Outlet />;
};

// Para login y registro: si ya hay sesion, va directo al inicio
export const PublicOnlyRoute = () => {
  const { user, cargando } = useAuth();

  if (cargando) {
    return <div className="pantalla-carga">Cargando...</div>;
  }

  if (user) {
    return <Navigate to="/inicio" replace />;
  }

  return <Outlet />;
};
