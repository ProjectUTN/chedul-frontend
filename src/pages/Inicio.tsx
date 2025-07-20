import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authProvider";

function Inicio() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <h1>Ruta privada, pero: {user.nombre} , esta autenticado</h1>;
}

export default Inicio;
