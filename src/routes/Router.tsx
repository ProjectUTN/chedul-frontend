import { BrowserRouter, Route, Routes } from "react-router-dom";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import Inicio from "../pages/Inicio";
import { ProtectedRoute, PublicOnlyRoute } from "./ProtectedRoute";
import Estado from "../pages/Estado";
import Layout from "../layouts/Layout";
import Mails from "../pages/Mails";
import Aportes from "../pages/Aportes";
import FormularioAporte from "../pages/FormularioAporte";
import Calendario from "../pages/Calendario";
import Horarios from "../pages/Horarios";
import MapaCorrelativas from "../pages/MapaCorrelativas";
import Landing from "../pages/Landing";
import Estudiar from "../pages/Estudiar";
import Herramientas from "../pages/Herramientas";
import Electivas from "../pages/Electivas";
import Comunidades from "../pages/Comunidades";
import Ordenanza531 from "../pages/Ordenanza531";
import Perfil from "../pages/Perfil";
import ImportarSysacad from "../pages/ImportarSysacad";

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rutas públicas */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/" element={<Landing />} />
          <Route path="/registro" element={<SignUp />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Rutas privadas */}
        <Route element={<ProtectedRoute redirectPath="/login" />}>
          <Route element={<Layout />}>
            <Route path="/inicio" element={<Inicio />} />
            <Route path="/estado" element={<Estado />} />
            <Route path="/estado/importar" element={<ImportarSysacad />} />
            <Route path="/aportes" element={<Aportes />} />
            <Route path="/aportes/nuevo" element={<FormularioAporte />} />
            <Route path="/aportes/:id/editar" element={<FormularioAporte />} />
            <Route path="/calendario" element={<Calendario />} />
            <Route path="/horarios" element={<Horarios />} />
            <Route path="/herramientas" element={<Herramientas />} />
            <Route path="/herramientas/estudiar" element={<Estudiar />} />
            <Route path="/herramientas/electivas" element={<Electivas />} />
            <Route path="/herramientas/531" element={<Ordenanza531 />} />
            <Route path="/herramientas/comunidades" element={<Comunidades />} />
            <Route path="/correlativas" element={<MapaCorrelativas />} />
            <Route path="/correos" element={<Mails />} />
            <Route path="/perfil" element={<Perfil />} />
          </Route>
        </Route>

        {/* Ruta para 404 */}
        <Route path="*" element={<h1 className="no-encontrada">404: Página no encontrada</h1>} />
      </Routes>
    </BrowserRouter>
  );
};
