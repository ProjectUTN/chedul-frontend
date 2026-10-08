import { Outlet } from "react-router-dom";
import Menu from "../components/menu";
import { useAuth } from "../context/authProvider";
import { TemporizadorProvider } from "../features/estudio/TemporizadorProvider";
import "./layout.css";

const Layout = () => {
  const { user } = useAuth();

  const contenido = (
    <section className="layout">
      <Menu />
      <main className="main-content">
        <Outlet />
      </main>
    </section>
  );

  // El temporizador de estudio vive en el layout: sigue andando al cambiar de seccion
  return user ? <TemporizadorProvider alumnoId={user.id}>{contenido}</TemporizadorProvider> : contenido;
};

export default Layout;
