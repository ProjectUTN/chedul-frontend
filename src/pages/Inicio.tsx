import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authProvider";

function Inicio() {
  // TODO: por ahora lo saco para que la ruta sea publica
  // const { user } = useAuth();
  // if (!user) {
  //   return <Navigate to="/login" replace />;
  // }

  return (
    <div className="inicio-container">
      Bienvenido a Chedul!
      {/* <h1>Bienvenido, {user.nombre}!</h1>
      <p>Tu correo electrónico es: {user.email}</p> */}
    </div>
  );
}

export default Inicio;
